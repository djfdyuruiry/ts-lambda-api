import createAPI, { API } from "lambda-api"
import { inject, injectable, Container } from "inversify"

import { Endpoint } from "./Endpoint"
import { ErrorInterceptor } from "./ErrorInterceptor";
import { ControllerLoader } from "./ControllerLoader"
import { DecoratorRegistry } from "./DecoratorRegistry"
import { AppConfig } from "../model/AppConfig"
import { ApiRequest } from "../model/ApiRequest"
import { ApiResponse } from "../model/ApiResponse"
import { timed } from "../util/timed"

@injectable()
export class Server {
    private readonly api: API;
    private readonly errorInterceptors: ErrorInterceptor[]

    public constructor(@inject(AppConfig) apiConfig?: AppConfig) {
        this.api = createAPI(apiConfig)
        this.errorInterceptors = []
    }

    public configure(handler: (this: void, api: API) => void) {
        handler(this.api)
    }

    public addErrorInterceptor(errorInterceptor?: ErrorInterceptor) {
        if (!errorInterceptor) {
            throw new Error("Null or undefined errorInterceptor passed to Server::addErrorInterceptor")
        }

        this.errorInterceptors.push(errorInterceptor)
    }

    @timed
    public async discoverAndBuildRoutes(controllersPath: string, appContainer: Container) {
        await ControllerLoader.loadControllers(controllersPath)

        for (let endpointKey in DecoratorRegistry.Endpoints) {
            let apiEndpoint = new Endpoint(
                DecoratorRegistry.Endpoints[endpointKey],
                c => appContainer.get(c),
                ei => appContainer.get(ei),
                this.errorInterceptors
            )

            apiEndpoint.register(this.api)
        }
    }

    @timed
    public async processEvent(request: ApiRequest, context: any): Promise<ApiResponse> {
        let event: any = request

        return await this.api.run(event, context)
    }
}
