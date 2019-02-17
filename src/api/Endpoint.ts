import { Request, Response, API } from "lambda-api"

import { Controller } from "./Controller"
import { EndpointInfo } from "../model/EndpointInfo"

export class Endpoint {
    public constructor(private readonly endpointInfo: EndpointInfo,
        private readonly controllerFactory: (constructor: Function) => Controller) {
    }

    public register(api: API) {
        let registerMethod = this.mapHttpMethodToCall(api, this.endpointInfo.httpMethod)

        let rootPath = this.endpointInfo.controller.path || ""
        let endpointPath = this.endpointInfo.path || ""
        let path = `${rootPath}${endpointPath}`

        registerMethod(path, async (req, res) => await this.invoke(this, req, res))
    }

    // entry point or lambda-api request engine, self parameter required to inject
    // this instance into the invocation context as `this` is overwritten
    private async invoke(self: Endpoint, request: Request, response: Response) {
        // build a instance of the associated controller
        let controller: Controller = 
            self.controllerFactory(self.endpointInfo.controller.classConstructor)

        let produces: string

        if (self.endpointInfo.produces) {
            produces = self.endpointInfo.produces
        } else if (self.endpointInfo.controller.produces) {
            produces = self.endpointInfo.controller.produces
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

        let endpointResponse = await this.invokeControllerMethod(
            controller,
            self.endpointInfo.methodName, 
            request, 
            response
        )

        let rawRes: any = response

        if (!endpointResponse && rawRes._state !== "done") {
            throw `no content was set in response or returned by endpoint method, path: ${self.endpointInfo.path} | endpoint: ${self.endpointInfo.name}`
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

    private async invokeControllerMethod(controller: Controller, methodName: string, request: Request, response: Response) {
        var method: Function = controller[methodName]
        var parameters = this.buildEndpointParameters(request, response)

        return await method.apply(controller, parameters)
    }

    private buildEndpointParameters(request: Request, response: Response): any[] {
        return this.endpointInfo
            .parameterExtractors
            .map(pe => pe.extract(request, response))
    }
}
