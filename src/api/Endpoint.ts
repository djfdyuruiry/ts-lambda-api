import { interfaces } from "inversify"
import { API, Request, Response } from "lambda-api"

import { EndpointInfo } from "../model/reflection/EndpointInfo"
import { AuthResult } from "../model/security/AuthResult"
import { Principal } from "../model/security/Principal"
import { ILogger } from "../util/logging/ILogger"
import { LogFactory } from "../util/logging/LogFactory"
import { Controller } from "./Controller"
import { ErrorInterceptor } from "./error/ErrorInterceptor"
import { MiddlewareRegistry } from "./MiddlewareRegistry"

export type ControllerFactory = (constructor: Function) => Controller
export type ErrorInterceptorFactory = (type: interfaces.ServiceIdentifier<ErrorInterceptor>) => ErrorInterceptor

export class Endpoint {
    private readonly logger: ILogger

    public constructor(
        private readonly endpointInfo: EndpointInfo,
        private readonly controllerFactory: ControllerFactory,
        private readonly errorInteceptorFactory: ErrorInterceptorFactory,
        private readonly middlewareRegistry: MiddlewareRegistry,
        private readonly logFactory: LogFactory
    ) {
        this.logger = logFactory.getLogger(Endpoint)
    }

    public register(api: API) {
        let registerMethod = this.mapHttpMethodToCall(api, this.endpointInfo.httpMethod)

        registerMethod(
            this.endpointInfo.fullPath,
            async (req, res) => await this.invoke(req, res)
        )
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
        if (this.endpointInfo.authenticationDisabled) {
            return
        }

        let authResult = await this.authenticateRequest(request, response)

        if (!authResult.authenticated) {
            this.sendStatusCodeResponse(401, response)
        }

        if (!await this.authorizeRequest(authResult.principal)) {
            this.sendStatusCodeResponse(403, response)
        }

        return authResult.principal
    }

    private async authenticateRequest(request: Request, response: Response) {
        let authResult = new AuthResult()
        let authScheme = ""

        if (this.middlewareRegistry.authFilters.length < 1) {
            authResult.authenticated = true
            return authResult
        }

        for (let filter of this.middlewareRegistry.authFilters) {
            authScheme = filter.authenticationSchemeName

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

        if (!authResult.authenticated && authScheme) {
            response.header("WWW-Authenticate", authScheme)
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
        let roles = this.endpointInfo.roles

        if (!roles || roles.length < 1) {
            return true
        }

        if (this.middlewareRegistry.authorizers.length < 1) {
            throw new Error(
                "Role restrictions were declared but no authorizer was registered in the middleware registry, " +
                `path: ${this.endpointInfo.path} | endpoint: ${this.endpointInfo.name}`)
        }

        for (let authorizer of this.middlewareRegistry.authorizers) {
            // endpoint roles, if defined, override controller roles
            for (let role of roles) {
                if (await authorizer.authorize(principal, role)) {
                    return true
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
        if (!this.endpointInfo.controller) {
            return this.buildDynamicControllerInstance(request, response)
        }

        let controller: Controller =
            this.controllerFactory(this.endpointInfo.controller.classConstructor)

        if (typeof(controller.setRequest) === "function") {
            controller.setRequest(request)
        }

        if (typeof(controller.setResponse) === "function") {
            controller.setResponse(response)
        }

        if (typeof(controller.setLogger) === "function") {
            controller.setLogger(
                this.logFactory.getLogger(this.endpointInfo.controller.classConstructor)
            )
        }

        return controller
    }

    /**
     * If an endpoint is function only (has no controller bound to it), we
     * build a dynamic controller which simulates a controller instance.
     */
    private buildDynamicControllerInstance(request: Request, response: Response) {
        let dynamicController = {
            request,
            response
        }

        dynamicController[this.endpointInfo.methodName] = this.endpointInfo.method

        return dynamicController
    }

    private setResponseContentType(response: Response) {
        let produces = this.endpointInfo.responseContentType

        if (produces) {
            response.removeHeader("Content-Type")
                .header("Content-Type", produces)
        }
    }

    private mapHttpMethodToCall(api: API, method: string) {
        if (method === "GET") {
            return api.get
        } else if (method === "POST") {
            return api.post
        } else if (method === "PUT") {
            return api.put
        } else if (method === "PATCH") {
            return api.patch
        } else if (method === "DELETE") {
            return api.delete
        }

        throw new Error(`Unrecognised HTTP method ${method}`)
    }

    private async invokeControllerMethod(
        controller: Controller, request: Request, response: Response, principal: Principal
    ) {
        let method: Function = controller[this.endpointInfo.methodName]
        let parameters = this.buildEndpointParameters(request, response, principal)

        try {
            return await method.apply(controller, parameters)
        } catch (ex) {
            let errorInterceptor = this.getMatchingErrorInterceptor()

            if (errorInterceptor) {
                let interceptorResponse = await errorInterceptor.intercept({
                    endpointController: controller,
                    endpointMethod: method,
                    endpointMethodParameters: parameters,
                    error: ex,
                    request,
                    response
                })

                if (this.responseSent(response, interceptorResponse)) {
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

        if (this.endpointInfo.endpointErrorInterceptor) {
            decoratorInterceptor = this.errorInteceptorFactory(this.endpointInfo.endpointErrorInterceptor)
        }

        if (decoratorInterceptor) {
            decoratorInterceptor.controllerTarget = this.endpointInfo.getControllerPropOrDefault(c => c.name)
            decoratorInterceptor.endpointTarget = this.endpointInfo.name

            return decoratorInterceptor
        }

        return this.middlewareRegistry.errorInterceptors
            .find(i =>
                i.shouldIntercept(
                    this.endpointInfo.getControllerPropOrDefault(c => c.name),
                    this.endpointInfo.name
                )
            )
    }
}
