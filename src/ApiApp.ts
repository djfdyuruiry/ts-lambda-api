import "reflect-metadata"

import { Container } from "inversify"
import { API } from "lambda-api"

import { Server } from "./api/Server"
import { AppConfig } from "./model/AppConfig"
import { ApiRequest } from "./model/ApiRequest"
import { ApiResponse } from "./model/ApiResponse"
import { ILogger } from "./util/logging/ILogger"
import { LogFactory } from "./util/logging/LogFactory"

/**
 * Application base class which combines the `Server`, `Container` (see `InversifyJS`)
 * and `AppConfig` classes to create a decorator driven API with typescript
 * middleware and dependency injection. It uses the `lambda-api` package as the
 * underlying HTTP API framework.
 *
 * AWS Lambda requests are handled by the `run` method, which will return a response
 * compatible with either API Gateway or an ALB.
 *
 * Extending this class will allow creating an app implementation for runtimes,
 * AWS Lambda, Local Web Server etc.
 */
export abstract class ApiApp {
    protected readonly apiServer: Server
    protected readonly logFactory: LogFactory

    protected logger: ILogger
    protected initialised: boolean

    public get middlewareRegistry() {
        return this.apiServer.middlewareRegistry
    }

    /**
     * Create a new app.
     *
     * @param controllersPath (Optional) Paths to the directories that contain controller `js` files that
     *                        declare controllers. Required if the default `Container` is used, or the
     *                        `autoInjectionEnabled` is set to `true`. Ignored if the `autoInjectionEnabled`
     *                        is set to `false`.
     * @param appConfig (Optional) Application config to pass to `lambda-api`, defaults to new `AppConfig`.
     * @param autoInjectionEnabled (Optional) Is auto injection enabled in the IOC container? Defaults to `true`.
     * @param appContainer (Optional) `InversifyJS` IOC `Container` instance which can
     *                     build controllers and error interceptors, defaults to new `Container` using
     *                     `autobind` flag set to `true` if `autoInjectionEnabled` is `true`. If you pass your own
     *                     instance `autoInjectionEnabled` must reflect the autobind flag passed to the Container.
     */
    public constructor(
        protected readonly controllersPath?: string[],
        protected appConfig: AppConfig = new AppConfig(),
        protected autoInjectionEnabled: boolean = true,
        protected appContainer: Container = new Container(autoInjectionEnabled ? { autobind: true } : {}),
    ) {
        if (autoInjectionEnabled) {
            if (!Array.isArray(controllersPath) || controllersPath.length < 1) {
                throw new Error("controllersPath passed to ApiApp was not an array")
            }

            if (controllersPath.length < 1) {
                throw new Error("controllersPath passed to ApiApp was empty")
            }

            if (controllersPath.findIndex(p => typeof p !== "string" || p.trim() === "") > -1) {
                throw new Error("One or more paths in controllersPaths passed to ApiApp was null, empty or whitespace")
            }
        }

        appContainer.bind(AppConfig).toConstantValue(this.appConfig)

        this.apiServer = new Server(appContainer, autoInjectionEnabled, this.appConfig)
        this.logFactory = new LogFactory(appConfig)

        this.logger = this.logFactory.getLogger(ApiApp)
        this.initialised = false
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
     * @param configureBlock Function that takes an `API` instance as a parameter.
     */
    public configureApi(configureBlock: (this: void, api: API) => void) {
        this.apiServer.configure(configureBlock)
    }

    /**
     * Run using the passed event and context, ultimately should call the
     * `processEvent` method on the `apiServer` instance.
     *
     * @param event API Gateway or ALB request.
     * @param context Request context.
     * @returns The response.
     */
    public abstract run(event: ApiRequest, context: any): Promise<ApiResponse>

    /**
     * Initialise all controllers and endpoints declared using decorators.
     */
    public async initialiseControllers() {
        if (this.initialised) {
            this.logger.debug("Ignoring call to initialiseControllers, app has already been initialised")

            return
        }

        this.logger.debug("Initialising app controllers")

        try {
            await this.apiServer.discoverAndBuildRoutes(this.controllersPath)

            this.initialised = true
        } catch (ex) {
            this.logger.fatal("Error initialising API app:\n%s",
                ex instanceof Error ? ex.stack : ex)

            throw ex
        }
    }
}
