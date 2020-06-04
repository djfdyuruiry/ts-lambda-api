import path from "path"

import { Setup } from "alsatian"

import { AppConfig, ApiLambdaApp, ApiRequest, ApiResponse, LogLevel } from "../../dist/ts-lambda-api"

export class TestBase {
    protected static readonly CONTROLLERS_PATH: string = path.join(__dirname, "test-controllers")

    protected appConfig: AppConfig
    protected app: ApiLambdaApp

    @Setup
    public setup(appConfig?: AppConfig) {
        this.appConfig = appConfig || new AppConfig()
        this.appConfig.serverLogger = {
            level: LogLevel.trace
        }

        this.appConfig.logger = {
            level: "trace"
        }

        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, this.appConfig)
    }

    protected async sendRequest(request: ApiRequest): Promise<ApiResponse> {
        return await this.app.run(request, {})
    }
}
