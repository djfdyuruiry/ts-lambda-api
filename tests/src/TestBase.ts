import path from "path"

import { Setup } from "alsatian"

import { ApiLambdaApp, ApiRequest } from "../../src/typescript-lambda-api"

export class TestBase {
    protected static readonly CONTROLLERS_PATH: string = path.join(__dirname, "test-controllers")

    protected app: ApiLambdaApp

    @Setup
    public setup() {
        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH)
    }

    protected async sendRequest(request: ApiRequest) {
        return await this.app.run(request, {})
    }
}
