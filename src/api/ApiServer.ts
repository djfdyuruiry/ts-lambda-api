import createAPI, { API } from "lambda-api"
import { inject, injectable, Container } from "inversify"

import { ApiEndpoint } from "./ApiEndpoint"
import { ApiControllerLoader } from "./ApiControllerLoader"
import { ApiDecoratorRegistry } from "./ApiDecoratorRegistry"
import { AppConfig } from "../model/AppConfig"
import { ApiRequest } from "../model/ApiRequest"
import { ApiResponse } from "../model/ApiResponse"
import { timed } from "../util/timed"

@injectable()
export class ApiServer {
    private readonly api: API;

    public constructor(@inject(AppConfig) apiConfig?: AppConfig) {
        this.api = createAPI(apiConfig)
    }

    public configure(handler: (api: API) => void) {
        handler(this.api)
    }

    @timed
    public async discoverAndBuildRoutes(controllersPath: string, appContainer: Container) {
        await ApiControllerLoader.loadControllers(controllersPath)

        for (let endpointKey in ApiDecoratorRegistry.Endpoints) {
            let apiEndpoint = new ApiEndpoint(
                ApiDecoratorRegistry.Endpoints[endpointKey],
                c => appContainer.get(c)
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
