import { Container } from "inversify"

import { ApiApp } from "./ApiApp"
import { AppConfig } from "./model/AppConfig"
import { ApiRequest } from "./model/ApiRequest"
import { timed } from "./util/timed"

/**
 * Impementation of the `ApiApp` class that handles native
 * AWS Lambda requests and can be used to provide a Lambda
 * function handler.
 *
 * The `run` method is the function handler entrypoint.
 */
export class ApiLambdaApp extends ApiApp {
    /**
     * Create a new lambda app.
     *
     * @param controllersPath (Optional) Paths to the directories that contain controller `js` files.
     *                        Required if the default `Container` is used, or the provided
     *                        `Container` instance has its `autobind` flag enabled.
     *                        Ignored if the provided `Container` instance has its `autobind` flag enabled.
     * @param appConfig (Optional) Application config to pass to `lambda-api`.
     * @param autoInjectionEnabled (Optional) Enable auto injection in IOC container, defaults to new `true`.
     * @param appContainer (Optional) `InversifyJS` IOC `Container` instance which can
     *                     build controllers and error interceptors, defaults to new `Container` using
     *                     `autobind` flag set to `true` if `autoInjectionEnabled` is `true`.
     */
    public constructor(controllersPath?: string[], appConfig?: AppConfig, autoInjectionEnabled?: boolean, appContainer?: Container) {
        super(controllersPath, appConfig, autoInjectionEnabled, appContainer)

        this.logger = this.logFactory.getLogger(ApiLambdaApp)
    }

    /**
     * Process the passed lambda event and context as a synchronous HTTP request.
     *
     * @param event API Gateway or ALB request.
     * @param context Request context.
     * @returns The response.
     */
    @timed
    public async run(event: ApiRequest, context: any) {
        this.logger.info("Received event, initialising controllers and processing event")

        await super.initialiseControllers()

        return await this.apiServer.processEvent(event, context)
    }
}
