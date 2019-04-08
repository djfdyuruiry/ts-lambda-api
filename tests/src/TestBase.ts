import path from "path"

import { Setup } from "alsatian"

import { AppConfig, ApiLambdaApp, ApiRequest, ApiResponse } from "../../dist/typescript-lambda-api"

export class TestBase {
    protected static readonly CONTROLLERS_PATH: string = path.join(__dirname, "test-controllers")

    protected app: ApiLambdaApp

    @Setup
    public setup(appConfig?: AppConfig) {
        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, appConfig)
    }

    protected async sendRequest(request: ApiRequest): Promise<ApiResponse> {
        return await this.app.run(request, {})
    }
}
