import createAPI, { API } from "lambda-api"
import { inject, injectable, Container } from "inversify"

import { ApiRequest } from "../model/ApiRequest"
import { ApiResponse } from "../model/ApiResponse"
import { AppConfig } from "../model/AppConfig"
import { timed } from "../util/timed"
import { Endpoint } from "./Endpoint"
import { MiddlewareRegistry } from "./MiddlewareRegistry"
import { ControllerLoader } from "./reflection/ControllerLoader"
import { DecoratorRegistry } from "./reflection/DecoratorRegistry"
import { SwaggerGenerator } from "./swagger/SwaggerGenerator"

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
     * This method must be called before invoking the `processEvent` method.
     *
     * @param controllersPath Path to the directory containing controller `js` files.
     * @param appContainer `InversifyJS` IOC `Container` instance which can build controllers and error interceptors.
     */
    @timed
    public async discoverAndBuildRoutes(controllersPath: string) {
        await ControllerLoader.loadControllers(controllersPath)

        if (this.appConfig.swagger && this.appConfig.swagger.enabled) {
            this.registerSwaggerEndpoints()
        }

        for (let endpointKey in DecoratorRegistry.Endpoints) {
            if (!DecoratorRegistry.Endpoints.hasOwnProperty(endpointKey)) {
                continue
            }

            let apiEndpoint = new Endpoint(
                DecoratorRegistry.Endpoints[endpointKey],
                c => this.appContainer.get(c),
                ei => this.appContainer.get(ei),
                this._middlewareRegistry
            )

            apiEndpoint.register(this.api)
        }
    }

    private registerSwaggerEndpoints() {
        this.api.get("/swagger.json", async () =>
            await SwaggerGenerator.exportApiSwaggerSpec()
        )

        this.api.get("/swagger.yml", async (_, res) =>
            res.header("Content-Type", "application/yml")
                .send(
                    await SwaggerGenerator.exportApiSwaggerSpec("yml")
                )
        )
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
