import { interfaces } from "inversify"
import { Request, Response, API } from "lambda-api"

import { Controller } from "./Controller"
import { MiddlewareRegistry } from './MiddlewareRegistry';
import { ErrorInterceptor } from "./error/ErrorInterceptor"
import { EndpointInfo } from "../model/reflection/EndpointInfo"
import { AuthResult } from "../model/security/AuthResult"
import { Principal } from "../model/security/Principal"
import { IAuthorizer } from "./security/IAuthorizer";

export class Endpoint {
    public constructor(private readonly endpointInfo: EndpointInfo,
        private readonly controllerFactory: (constructor: Function) => Controller,
        private readonly errorInteceptorFactory: (type: interfaces.ServiceIdentifier<ErrorInterceptor>) => ErrorInterceptor,
        private readonly middlewareRegistry: MiddlewareRegistry) {
    }

    public register(api: API) {
        let registerMethod = this.mapHttpMethodToCall(api, this.endpointInfo.httpMethod)

        let rootPath = this.endpointInfo.controller.path || ""
        let endpointPath = this.endpointInfo.path || ""
        let path = `${rootPath}${endpointPath}`

        registerMethod(path, async (req, res) => await this.invoke(req, res))
    }

    // entry point for lambda-api request engine
    private async invoke(request: Request, response: Response) {
        let principal = await this.authenticateAndAuthorizeRequest(request, response)

        if (this.responseSent(response)) {
            // 401 or 403 response was sent
            return
        }

        let controller = this.buildControllerInstance(request, response)

        this.setResponseContentType(response)

        let endpointResponse = await this.invokeControllerMethod(controller, request, response, principal)

        if (!this.responseSent(response, endpointResponse)) {
            throw new Error("no response was sent by or value returned from endpoint method, " +
                `path: ${this.endpointInfo.path} | endpoint: ${this.endpointInfo.name}`)
        }

        return endpointResponse
    }

    private async authenticateAndAuthorizeRequest(request: Request, response: Response) {
        let authResult = await this.authenticateRequest(request)

        if(!authResult.authenticated) {
            this.sendStatusCodeResponse(401, response)
        }

        if(!await this.authorizeRequest(authResult.principal)) {
            this.sendStatusCodeResponse(403, response)
        }

        return authResult.principal
    }

    private async authenticateRequest(request: Request) {
        let authResult = new AuthResult()

        if (this.middlewareRegistry.authFilters.length < 1) {
            authResult.authenticated = true
            return authResult
        }

        for (let filter of this.middlewareRegistry.authFilters) {
            let authData = await filter.extractAuthData(request)

            if (authData) {
                // authData extraction was either aborted or failed
                authResult.principal = await filter.authenticate(authData)
            }

            authResult.authenticated =
                (authResult.principal !== null && authResult.principal !== undefined)

            if (authResult.authenticated) {
                // return after finding a filter that authenticates the user
                return authResult
            }
        }

        return authResult
    }

    private sendStatusCodeResponse(statusCode: number, response: Response) {
        response.status(statusCode)
                .removeHeader("content-type")
                .header("content-type", "text/plain")
                .send("")
    }

    private async authorizeRequest(principal: Principal) {
        let controllerRoles = this.endpointInfo.controller.rolesAllowed
        let endpointRoles = this.endpointInfo.rolesAllowed
        let roleRequired = controllerRoles || endpointRoles

        if (!roleRequired) {
            return true
        }

        if (this.middlewareRegistry.authAuthorizers.length < 1) {
            throw new Error("Role restrictions were declared but no authorizer was registered in the middleware registry, " +
                `path: ${this.endpointInfo.path} | endpoint: ${this.endpointInfo.name}`)
        }

        for (let authorizer of this.middlewareRegistry.authAuthorizers) {
            if (endpointRoles) {
                // endpoint roles, if defined, override controller roles
                for (let role of endpointRoles) {
                    if (await authorizer.authorize(principal, role)) {
                        return true
                    }
                }
            } else if (controllerRoles) {
                for (let role of controllerRoles) {
                    if (await authorizer.authorize(principal, role)) {
                        return true
                    }
                }
            }
        }

        return false
    }

    private responseSent(response?: Response, endpointResponse?: any) {
        let rawRes: any = response

        return endpointResponse || (rawRes && rawRes._state === "done")
    }

    private buildControllerInstance(request: Request, response: Response): any {
        let controller: Controller =
            this.controllerFactory(this.endpointInfo.controller.classConstructor)

        if (typeof(controller.setRequest) === "function") {
            controller.setRequest(request)
        }

        if (typeof(controller.setResponse) === "function") {
            controller.setResponse(response)
        }

        return controller
    }

    private setResponseContentType(response: Response) {
        let produces: string

        if (this.endpointInfo.produces) {
            produces = this.endpointInfo.produces
        } else if (this.endpointInfo.controller.produces) {
            produces = this.endpointInfo.controller.produces
        }

        if (produces) {
            response.removeHeader("Content-Type")
                .header("Content-Type", produces)
        }
    }

    private mapHttpMethodToCall(api: API, method: string) {
        if (method == "GET") {
            return api.get
        } else if (method == "POST") {
            return api.post
        } else if (method == "PUT") {
            return api.put
        } else if (method == "PATCH") {
            return api.patch
        } else if (method == "DELETE") {
            return api.delete
        }

        throw new Error(`Unrecognised HTTP method ${method}`)
    }

    private async invokeControllerMethod(controller: Controller, request: Request, response: Response, principal: Principal) {
        var method: Function = controller[this.endpointInfo.methodName]
        var parameters = this.buildEndpointParameters(request, response, principal)

        try {
            return await method.apply(controller, parameters)
        } catch(ex) {
            let errorInterceptor = this.getMatchingErrorInterceptor()

            if (errorInterceptor) {
                let interceptorResponse = await errorInterceptor.intercept({
                    error: ex,
                    endpointMethodParameters: parameters,
                    endpointMethod: method,
                    endpointController: controller,
                    request: request,
                    response: response
                })

                if(this.responseSent(response, interceptorResponse)) {
                    return interceptorResponse
                }
            }

            throw ex
        }
    }

    private buildEndpointParameters(request: Request, response: Response, principal: Principal): any[] {
        return this.endpointInfo
            .parameterExtractors
            .map(pe => pe.extract(request, response, principal))
    }

    private getMatchingErrorInterceptor() {
        let decoratorInterceptor: ErrorInterceptor

        if (this.endpointInfo.errorInterceptor) {
            decoratorInterceptor = this.errorInteceptorFactory(this.endpointInfo.errorInterceptor)
        } else if (this.endpointInfo.controller.errorInterceptor) {
            decoratorInterceptor = this.errorInteceptorFactory(this.endpointInfo.controller.errorInterceptor)
        }

        if (decoratorInterceptor) {
            decoratorInterceptor.controllerTarget = this.endpointInfo.controller.name
            decoratorInterceptor.endpointTarget = this.endpointInfo.name

            return decoratorInterceptor
        }

        return this.middlewareRegistry.errorInterceptors
            .find(i => i.shouldIntercept(this.endpointInfo.controller.name, this.endpointInfo.name))
    }
}
