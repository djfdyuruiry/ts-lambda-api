import { interfaces } from "inversify"
import { Request, Response, API } from "lambda-api"

import { Controller } from "./Controller"
import { ErrorInterceptor } from "./error/ErrorInterceptor"
import { EndpointInfo } from "../model/reflection/EndpointInfo"
import { IAuthFilter } from "./security/IAuthFilter"
import { AuthResult } from "../model/security/AuthResult"
import { Principal } from "../model/security/Principal"

export class Endpoint {
    public constructor(private readonly endpointInfo: EndpointInfo,
        private readonly controllerFactory: (constructor: Function) => Controller,
        private readonly errorInteceptorFactory: (type: interfaces.ServiceIdentifier<ErrorInterceptor>) => ErrorInterceptor,
        private readonly errorInterceptors: ErrorInterceptor[] = [],
        private readonly authFilters: IAuthFilter<any, Principal>[] = []) {
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
        let authResult = await this.authenticateRequest(request)

        if(!authResult.authenticated) {
            response.status(401)
                .removeHeader("content-type")
                .header("content-type", "text/plain")
                .send("")

            return
        }

        // build a instance of the associated controller
        let controller: Controller =
            this.controllerFactory(this.endpointInfo.controller.classConstructor)
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

        if (typeof(controller.setRequest) === "function") {
            controller.setRequest(request)
        }

        if (typeof(controller.setResponse) === "function") {
            controller.setResponse(response)
        }

        let endpointResponse = await this.invokeControllerMethod(controller, request, response, authResult.user)

        if (!this.responseDetected(endpointResponse, response)) {
            throw new Error("no content was set in response or returned by endpoint method, " +
                `path: ${this.endpointInfo.path} | endpoint: ${this.endpointInfo.name}`)
        }

        return endpointResponse
    }

    private responseDetected(endpointResponse: any, response: Response): any {
        let rawRes: any = response

        return endpointResponse || (rawRes && rawRes._state === "done")
    }

    private mapHttpMethodToCall(api: API, method: string): Function {
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

                if(this.responseDetected(interceptorResponse, response)) {
                    return interceptorResponse
                }
            }

            throw ex
        }
    }

    private async authenticateRequest(request: Request) {
        let authResult = new AuthResult()

        if (this.authFilters.length < 1) {
            authResult.authenticated = true
            return authResult
        }

        for (let filter of this.authFilters) {
            try {
                authResult.user = await filter.invoke(request)
                authResult.authenticated = true

                // return after finding a filter that does not throw an error
                return authResult
            } catch(ex) {
                let a = 22
            }
        }

        return authResult
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

        return this.errorInterceptors
            .find(i => i.shouldIntercept(this.endpointInfo.controller.name, this.endpointInfo.name))
    }
}
