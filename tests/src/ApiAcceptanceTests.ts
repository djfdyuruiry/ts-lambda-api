import { Expect, AsyncTest, TestFixture, TestCase } from "alsatian"
import { ReplaceOperation } from "fast-json-patch/lib/core"

import { RequestBuilder, JsonPatch } from "../../index"
import { METHODS } from "lambda-api"

import { TestBase } from "./TestBase"
import { Person } from "./test-controllers/model/Person"

@TestFixture()
export class ApiAcceptanceTests extends TestBase {
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

    @TestCase("POST", "/test/methods/post")
    @TestCase("PUT", "/test/methods/put")
    @AsyncTest()
    public async when_request_with_body_made_for_decorator_route_then_app_passes_body_to_endpoint_and_returns_http_status_200_ok(
        method: METHODS,
        path: string
    ) {
        let requestBody: Person = {
            name: "ezra",
            age: 23
        }

        let response = await this.sendRequest(
            RequestBuilder.do(method, path)
                .body(JSON.stringify(requestBody))
                .build()
        )

        Expect(response.statusCode).toEqual(200)
        Expect(JSON.parse(response.body)).toEqual(requestBody)
    }

    @AsyncTest()
    public async when_delete_request_made_then_app_returns_http_status_204_no_content() {
        let response = await this.sendRequest(
            RequestBuilder.delete("/test/methods/delete").build()
        )

        Expect(response.statusCode).toEqual(204)
    }

    @AsyncTest()
    public async when_patch_request_made_then_app_endpoint_applies_json_patch() {
        let replaceOp: ReplaceOperation<string> = {
            op: "replace",
            path: "/name",
            value: "I patched it!"
        }
    
        let jsonPatch: JsonPatch = [replaceOp]
        
        let response = await this.sendRequest(
            RequestBuilder.patch("/test/methods/patch")
                .body(JSON.stringify(jsonPatch))
                .build()
        )

        Expect(JSON.parse(response.body)).toEqual({
            name: "I patched it!",
            age: 42
        })
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

    @TestCase("/test/header-test")
    @TestCase("/test/injected-header-test")
    @AsyncTest()
    public async when_request_made_with_header_then_app_passes_value_to_endpoint(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(path)
                .header("x-test-header", "header_value")
                .build()
        )

        Expect(response.body).toEqual("Header: header_value")
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

        Expect(JSON.parse(response.body)).toEqual({
            some: "value"
        })
    }
}
