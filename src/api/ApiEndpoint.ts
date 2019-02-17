import { Request, Response, API } from "lambda-api"

import { Controller } from "./Controller"
import { ApiEndpointInfo } from "../model/ApiEndpointInfo"

export class ApiEndpoint {
    private readonly endpoint: ApiEndpointInfo
    private readonly controllerFactory: (constructor: Function) => Controller

    public constructor(endpoint: ApiEndpointInfo, controllerFactory: (constructor: Function) => Controller) {
        this.endpoint = endpoint
        this.controllerFactory = controllerFactory
    }

    public register(api: API) {
        let registerMethod = this.mapHttpMethodToCall(api, this.endpoint.httpMethod)

        let rootPath = this.endpoint.controller.path || ""
        let endpointPath = this.endpoint.path || ""
        let path = `${rootPath}${endpointPath}`

        registerMethod(path, async (req, res) => await this.invoke(this, req, res))
    }

    // entry point or lambda-api request engine, self parameter required to inject
    // this instance into the invocation context as `this` is overwritten
    public async invoke(self: ApiEndpoint, request: Request, response: Response) {
        // build a instance of the associated controller
        let controller: Controller = 
            self.controllerFactory(self.endpoint.controller.classConstructor)

        let produces: string

        if (self.endpoint.produces) {
            produces = self.endpoint.produces
        } else if (self.endpoint.controller.produces) {
            produces = self.endpoint.controller.produces
        }

        if (produces) {
            response.removeHeader("Content-Type")
                .header("Content-Type", produces)
        } 

        controller.setRequest(request)
        controller.setResponse(response)

        let endpointResponse = await controller.invoke(self.endpoint.methodName, request, response)
        let rawRes: any = response

        if (!endpointResponse && rawRes._state !== "done") {
            throw `no content was set in response or returned by endpoint method, path: ${self.endpoint.path} | endpoint: ${self.endpoint.name}`
        }

        return endpointResponse
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

        throw `Unrecognised HTTP method ${method}`
    }

}
