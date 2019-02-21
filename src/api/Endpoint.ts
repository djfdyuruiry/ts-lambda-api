import { Request, Response, API } from "lambda-api"

import { Controller } from "./Controller"
import { ErrorInterceptor } from "./ErrorInterceptor"
import { EndpointInfo } from "../model/EndpointInfo"

export class Endpoint {
    public constructor(private readonly endpointInfo: EndpointInfo,
        private readonly controllerFactory: (constructor: Function) => Controller,
        private readonly errorInterceptors: ErrorInterceptor[] = []) {
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

        let endpointResponse = await this.invokeControllerMethod(controller, request, response)

        let rawRes: any = response

        if (!endpointResponse && rawRes && rawRes._state !== "done") {
            throw "no content was set in response or returned by endpoint method, " +
                `path: ${this.endpointInfo.path} | endpoint: ${this.endpointInfo.name}`
        }

        return endpointResponse
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

        throw `Unrecognised HTTP method ${method}`
    }

    private async invokeControllerMethod(controller: Controller, request: Request, response: Response) {
        var method: Function = controller[this.endpointInfo.methodName]
        var parameters = this.buildEndpointParameters(request, response)

        try {
            return await method.apply(controller, parameters)
        } catch(ex) {
            let errorInterceptor = this.getMatchingErrorInterceptor()

            if (!errorInterceptor) {
                throw ex
            }

            return await errorInterceptor.intercept({
                error: ex,
                endpointMethodParameters: parameters,
                endpointMethod: method,
                endpointController: controller,
                request: request,
                response: response
            })
        }
    }

    private buildEndpointParameters(request: Request, response: Response): any[] {
        return this.endpointInfo
            .parameterExtractors
            .map(pe => pe.extract(request, response))
    }

    private getMatchingErrorInterceptor() {
        return this.errorInterceptors
            .find(i => i.shouldIntercept(this.endpointInfo.controller.name, this.endpointInfo.name))
    }
}
