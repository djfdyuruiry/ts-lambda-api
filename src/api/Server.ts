import createAPI, { API } from "lambda-api"
import { inject, injectable, Container } from "inversify"

import { Endpoint } from "./Endpoint"
import { MiddlewareRegistry } from "./MiddlewareRegistry"
import { AppConfig } from "../model/AppConfig"
import { ApiRequest } from "../model/ApiRequest"
import { ApiResponse } from "../model/ApiResponse"
import { ControllerLoader } from "./reflection/ControllerLoader"
import { DecoratorRegistry } from "./reflection/DecoratorRegistry"
import { timed } from "../util/timed"

/**
 *
 */
@injectable()
export class Server {
    private readonly api: API
    private readonly _middlewareRegistry: MiddlewareRegistry

    /**
     *
     */
    public get middlewareRegistry() {
        return this._middlewareRegistry
    }

    /**
     *
     * @param apiConfig
     */
    public constructor(@inject(AppConfig) apiConfig?: AppConfig) {
        this.api = createAPI(apiConfig)
        this._middlewareRegistry = new MiddlewareRegistry()
    }

    /**
     *
     * @param handler
     */
    public configure(handler: (this: void, api: API) => void) {
        handler(this.api)
    }

    /**
     *
     * @param controllersPath
     * @param appContainer
     */
    @timed
    public async discoverAndBuildRoutes(controllersPath: string, appContainer: Container) {
        await ControllerLoader.loadControllers(controllersPath)

        for (let endpointKey in DecoratorRegistry.Endpoints) {
            let apiEndpoint = new Endpoint(
                DecoratorRegistry.Endpoints[endpointKey],
                c => appContainer.get(c),
                ei => appContainer.get(ei),
                this._middlewareRegistry
            )

            apiEndpoint.register(this.api)
        }
    }

    /**
     *
     * @param request
     * @param context
     */
    @timed
    public async processEvent(request: ApiRequest, context: any): Promise<ApiResponse> {
        let event: any = request

        return await this.api.run(event, context)
    }
}
