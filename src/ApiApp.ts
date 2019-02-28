import "reflect-metadata"

import { Container } from "inversify"
import { API } from "lambda-api"

import { Server } from "./api/Server"
import { AppConfig } from "./model/AppConfig"
import { ApiRequest } from "./model/ApiRequest"
import { ApiResponse } from "./model/ApiResponse"

/**
 * Application base class which combines the `Server`, `Container`(`InversifyJS`)
 * and `AppConfig` classes to create a decorator driven API with typescript
 * middleware and dependency injection. It uses the `lambda-api` package as the
 * underlying HTTP API framework.
 *
 * AWS Lambda requests are handled by the `run` method, which will return a response
 * compatible with either API Gateway or an ALB.
 *
 * Extending this class will allow creating an app implementation for runtimes,
 * AWS Lambda or local web server for example.
 */
export abstract class ApiApp {
    protected readonly apiServer: Server

    public get middlewareRegistry() {
        return this.apiServer.middlewareRegistry
    }

    /**
     * Create a new app.
     *
     * @param controllersPath Path to a directory containing `js` files containing that declare controllers.
     * @param appConfig (Optional) Application config to pass to `lambda-api`.
     * @param appContainer (Optional) `InversifyJS` IOC `Container` instance which can
     *                     build controllers and error interceptors.
     */
    public constructor(
        protected readonly controllersPath: string,
        protected appConfig: AppConfig = new AppConfig(),
        protected appContainer: Container = new Container({ autoBindInjectable: true })
    ) {
        this.apiServer = new Server(appContainer, appConfig)
    }

    /**
     * Configure the `InversifyJS` IOC `Container` instance.
     *
     * @param configureBlock Function that takes a `Container` instance as a parameter.
     */
    public configureApp(configureBlock: (this: void, container: Container) => void) {
        configureBlock(this.appContainer)
    }

    /**
     * Configure the `API` instance from the `lambda-api` package.
     *
     * @param handler Function that takes an `API` instance as a parameter.
     */
    public configureApi(configureBlock: (this: void, api: API) => void) {
        this.apiServer.configure(configureBlock)
    }

    /**
     * Run using the passed event and context, ultimately should call the
     * `processEvent` method on the `apiServer` instance.
     *
     * @param request API Gateway or ALB request.
     * @param context Request context.
     * @returns The response.
     */
    public abstract async run(event: ApiRequest, context: any): Promise<ApiResponse>

    /**
     * Initialise all controllers and endpoints declared using decorators.
     */
    public async initialiseControllers() {
        await this.apiServer.discoverAndBuildRoutes(this.controllersPath)
    }
}
