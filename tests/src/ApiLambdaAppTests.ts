import path from "path"

import { Expect, AsyncTest, TestFixture, TestCase } from "alsatian";

import { ApiLambdaApp, RequestBuilder } from "../../index"

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
        let response = await this.app.run(RequestBuilder.get(path).build(), {})

        Expect(response.statusCode).toEqual(expectedStatus)
    }
}
