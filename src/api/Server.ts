import createAPI, { API } from "lambda-api"
import { Container } from "inversify"

import { ApiRequest } from "../model/ApiRequest"
import { ApiResponse } from "../model/ApiResponse"
import { AppConfig } from "../model/AppConfig"
import { EndpointInfo } from "../model/reflection/EndpointInfo";
import { timed } from "../util/timed"
import { Endpoint } from "./Endpoint"
import { MiddlewareRegistry } from "./MiddlewareRegistry"
import { OpenApiGenerator, OpenApiFormat } from "./open-api/OpenApiGenerator"
import { ControllerLoader } from "./reflection/ControllerLoader"
import { DecoratorRegistry } from "./reflection/DecoratorRegistry"
import { BasicAuthFilter } from "./security/BasicAuthFilter"

/**
 * Server that discovers routes using decorators on controller
 * classes and methods. Processing of requests is preformed by the
 * `lambda-api` package.
 */
export class Server {
    private readonly api: API
    private readonly _middlewareRegistry: MiddlewareRegistry

    public get middlewareRegistry() {
        return this._middlewareRegistry
    }

    /**
     * Create a new server.
     *
     * @param appContainer Application container to use to build containers.
     * @param appConfig Application config to pass to `lambda-api`.
     */
    public constructor(private appContainer: Container, private appConfig?: AppConfig) {
        this.api = createAPI(appConfig)
        this._middlewareRegistry = new MiddlewareRegistry()
    }

    /**
     * Configure the `API` instance from the `lambda-api`
     * package.
     *
     * @param handler Function that takes an `API` instance as a parameter.
     */
    public configure(handler: (this: void, api: API) => void) {
        handler(this.api)
    }

    /**
     * Scans the specified path for javascript files and loads these into
     * the current runtime. Importing the files will invoke the decorators
     * declared within them. Note: this scans only the top level files.
     *
     * API decorators register controllers, endpoints, configuration and middleware.
     * A series of endpoints are built using the decorator components and registered
     * with the `lambda-api` package routing engine.
     *
     * Controllers and error interceptors registered by decorators are built using
     * an IOC container, which allows dependency injection.
     *
     * OpenAPI endpoints will be registered here, if they are enabled in the app
     * config by setting the `openApi.enabled` flag to true.
     *
     * This method must be called before invoking the `processEvent` method.
     *
     * @param controllersPath Path to the directory containing controller `js` files.
     * @param appContainer `InversifyJS` IOC `Container` instance which can build controllers and error interceptors.
     */
    @timed
    public async discoverAndBuildRoutes(controllersPath: string) {
        await ControllerLoader.loadControllers(controllersPath)

        if (this.appConfig.openApi && this.appConfig.openApi.enabled) {
            this.registerOpenApiEndpoints()
        }

        for (let endpointKey in DecoratorRegistry.Endpoints) {
            if (!DecoratorRegistry.Endpoints.hasOwnProperty(endpointKey)) {
                continue
            }

            this.registerEndpoint(DecoratorRegistry.Endpoints[endpointKey])
        }
    }

    private registerOpenApiEndpoints() {
        this.registerOpenApiEndpoint("json")
        this.registerOpenApiEndpoint("yml")
    }

    private registerOpenApiEndpoint(format: OpenApiFormat) {
        let specEndpoint = new EndpointInfo(
            `internal__openapi::${format}`,
            async () => await OpenApiGenerator.exportOpenApiSpec(format, this.appConfig, this._middlewareRegistry)
        )

        specEndpoint.path = `/open-api.${format}`
        specEndpoint.httpMethod = "GET"
        specEndpoint.noAuth = !this.appConfig.openApi.useAuthentication
        specEndpoint.produces = `application/${format}`

        this.registerEndpoint(specEndpoint)
    }

    private registerEndpoint(endpointInfo: EndpointInfo) {
        let apiEndpoint = new Endpoint(
            endpointInfo,
            c => this.appContainer.get(c),
            ei => this.appContainer.get(ei),
            this._middlewareRegistry
        )

        apiEndpoint.register(this.api)
    }

    /**
     * Takes an API request passed in by AWS Lambda and processes
     * it using the `lambda-api` package.
     *
     * @param request API Gateway or ALB request.
     * @param context Request context.
     * @returns The response.
     */
    @timed
    public async processEvent(request: ApiRequest, context: any): Promise<ApiResponse> {
        let event: any = request

        return await this.api.run(event, context)
    }
}
