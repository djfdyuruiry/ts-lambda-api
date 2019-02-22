import createAPI, { API } from "lambda-api"
import { inject, injectable, Container } from "inversify"

import { Endpoint } from "./Endpoint"
import { ErrorInterceptor } from "./error/ErrorInterceptor"
import { IAuthFilter } from "./security/IAuthFilter"
import { AppConfig } from "../model/AppConfig"
import { ApiRequest } from "../model/ApiRequest"
import { ApiResponse } from "../model/ApiResponse"
import { Principal } from '../model/security/Principal'
import { ControllerLoader } from "./reflection/ControllerLoader"
import { DecoratorRegistry } from "./reflection/DecoratorRegistry"
import { timed } from "../util/timed"

@injectable()
export class Server {
    private readonly api: API
    private readonly errorInterceptors: ErrorInterceptor[]
    private readonly authFilters: IAuthFilter<any, Principal>[]

    public constructor(@inject(AppConfig) apiConfig?: AppConfig) {
        this.api = createAPI(apiConfig)
        this.errorInterceptors = []
        this.authFilters = []
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

    public addAuthFilter<T, U extends Principal>(authFilter?: IAuthFilter<T, U>) {
        if (!authFilter) {
            throw new Error("Null or undefined authFilter passed to Server::addAuthFilter")
        }

        this.authFilters.push(authFilter)
    }

    @timed
    public async discoverAndBuildRoutes(controllersPath: string, appContainer: Container) {
        await ControllerLoader.loadControllers(controllersPath)

        for (let endpointKey in DecoratorRegistry.Endpoints) {
            let apiEndpoint = new Endpoint(
                DecoratorRegistry.Endpoints[endpointKey],
                c => appContainer.get(c),
                ei => appContainer.get(ei),
                this.errorInterceptors,
                this.authFilters
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
