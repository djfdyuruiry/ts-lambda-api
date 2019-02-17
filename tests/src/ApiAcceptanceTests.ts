import path from "path"

import { Expect, AsyncTest, TestFixture, TestCase, Test } from "alsatian";

import { ApiLambdaApp, ApiRequest, RequestBuilder } from "../../index"

@TestFixture()
export class ApiAcceptanceTests {
    private readonly app: ApiLambdaApp;

    public constructor() {
        this.app = new ApiLambdaApp(path.join(__dirname, "test-controllers"))
    }

    @TestCase("/test/")
    @TestCase("/test/no-root-path")
    @TestCase("/test/response-model")
    @TestCase("/test/injected-response-model")
    @AsyncTest()
    public async when_request_made_for_decorator_route_then_app_returns_http_status_200_ok(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(path).build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    @AsyncTest()
    public async when_request_made_for_endpoint_that_does_not_return_response_then_app_returns_http_status_500(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get("/test/no-return").build()
        )

        Expect(response.statusCode).toEqual(500)
    }

    @TestCase("/test/path-test")
    @TestCase("/test/injected-path-test")
    @AsyncTest()
    public async when_request_made_with_path_param_then_app_passes_value_to_endpoint(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(`${path}/steve/37`).build()
        )

        Expect(response.body).toEqual("Hey steve, you are 37")
    }

    @TestCase("/test/query-test")
    @TestCase("/test/injected-query-test")
    @AsyncTest()
    public async when_request_made_with_query_param_then_app_passes_value_to_endpoint(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(path)
                .query("magic", "enabled")
                .build()
        )

        Expect(response.body).toEqual("Magic status: enabled")
    }

    @AsyncTest()
    public async when_controller_produces_decorator_present_then_response_content_type_header_is_correct() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test").build()
        )
    
        Expect(response.headers["content-type"]).toEqual("text/plain")
    }

    @AsyncTest()
    public async when_controller_produces_decorator_present_then_response_body_is_correct() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test").build()
        )
    
        Expect(response.body).toEqual("OK")
    }

    @AsyncTest()
    public async when_endpoint_produces_decorator_present_then_response_content_type_header_is_correct() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test/produces").build()
        )

        Expect(response.headers["content-type"]).toEqual("application/json")
    }

    @AsyncTest()
    public async when_endpoint_produces_decorator_present_then_response_body_is_correct() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test/produces").build()
        )

        let responseObject = JSON.parse(response.body)

        Expect(responseObject).toEqual({
            some: "value"
        })
    }

    private async sendRequest(request: ApiRequest) {
        return await this.app.run(request, {})
    }
}
