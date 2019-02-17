import path from "path"

import { Expect, AsyncTest, TestFixture, TestCase } from "alsatian";

import { ApiLambdaApp, ApiRequest, RequestBuilder } from "../../index"

@TestFixture()
export class ApiLambdaAppTests {
    private readonly app: ApiLambdaApp;

    public constructor() {
        this.app = new ApiLambdaApp(path.join(__dirname, "test-controllers"))
    }

    @TestCase("/test/", 200)
    @TestCase("/test/response-model", 200)
    @TestCase("/test/no-return", 500)
    @TestCase("/test/no-content", 204)
    @AsyncTest()
    public async when_valid_request_made_then_app_returns_correct_http_status(
        path: string,
        expectedStatus: number
    ) {
        let response = await this.sendRequest(
            RequestBuilder.get(path).build()
        )

        Expect(response.statusCode).toEqual(expectedStatus)
    }

    @AsyncTest()
    public async when_valid_request_made_with_path_param_then_app_passes_value_to_endpoint() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test/path-test/steve/37")
                .build()
        )

        Expect(response.body).toEqual("Hey steve, you are 37")
    }

    @AsyncTest()
    public async when_valid_request_made_with_query_param_then_app_passes_value_to_endpoint() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test/query-test")
                .query("magic", "enabled")
                .build()
        )

        Expect(response.body).toEqual("Magic status: enabled")
    }

    private async sendRequest(request: ApiRequest) {
        return await this.app.run(request, {})
    }
}
