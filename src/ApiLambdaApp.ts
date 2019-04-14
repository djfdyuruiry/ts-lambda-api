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
     * @param controllersPath Path to the directory containing controller `js` files.
     * @param appConfig (Optional) Application config to pass to `lambda-api`.
     * @param appContainer (Optional) `InversifyJS` IOC `Container` instance which can build
     *                     controllers and error interceptors.
     */
    public constructor(controllersPath: string, appConfig?: AppConfig, appContainer?: Container) {
        super(controllersPath, appConfig, appContainer)

        this.logger = this.logFactory.getLogger(ApiLambdaApp)
    }

    /**
     * Process the passed lambda event and context as a synchronous HTTP request.
     *
     * @param request API Gateway or ALB request.
     * @param context Request context.
     * @returns The response.
     */
    @timed
    public async run(event: ApiRequest, context: any) {
        await super.initialiseControllers()

        return await this.apiServer.processEvent(event, context)
    }
}
