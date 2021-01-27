import { Expect, FocusTest, Test, TestCase, TestFixture } from "alsatian"
import { ReplaceOperation } from "fast-json-patch"
import { readFileSync, statSync as statFileSync, writeFileSync } from "fs"
import { METHODS } from "lambda-api"
import { sync as calculateFileMd5Sync } from "md5-file"
import { join as joinPath } from "path"
import { openSync as openTempFileSync } from "temp"

import { ApiLambdaApp, ApiResponse, JsonPatch, RequestBuilder } from "../../dist/ts-lambda-api"

import { TestBase } from "./TestBase"
import { Person } from "./test-components/model/Person"

@TestFixture()
export class ApiAcceptanceTests extends TestBase {
    private static readonly TEST_FILE_PATH = joinPath(__dirname, "../test.pdf")
    private static readonly TEST_FILE_SIZE = 19605
    private static readonly TEST_FILE_MD5 = "bb0cf6ccd0fe8e18e0a14e8028709abe"

    @TestCase("/test/")
    @TestCase("/test/no-root-path")
    @TestCase("/test/response-model")
    @TestCase("/test/injected-response-model")
    @Test()
    public async when_request_made_for_decorator_route_then_app_returns_http_status_200_ok(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(path).build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    @TestCase("POST", "/test/methods/post")
    @TestCase("POST", "/test/methods/post-raw")
    @TestCase("PUT", "/test/methods/put")
    @Test()
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

        let body = response.body

        if (response.isBase64Encoded) {
            body = Buffer.from(response.body, 'base64').toString('utf8')
        }

        Expect(JSON.parse(body)).toEqual(requestBody)
    }

    @Test()
    public async when_request_with_body_made_for_decorator_route_then_app_passes_typed_body_to_endpoint_and_returns_http_status_200_ok() {
        let requestBody = {
            id: 23,
            name: "ezra"
        }

        let response = await this.sendRequest(
            RequestBuilder.do("POST", "/test/methods/post-typed")
                .body(JSON.stringify(requestBody))
                .build()
        )

        Expect(response.statusCode).toEqual(200)

        Expect(response.body).toEqual("23/ezra")
    }

    @Test()
    public async when_request_with_body_made_for_decorator_route_then_body_is_validated_and_returns_400_if_not_valid() {
        let requestBody = {
            id: 23,
            name: "ezra",
            unknownField: 100
        }

        let response = await this.sendRequest(
            RequestBuilder.do("POST", "/test/methods/post-validated")
                .body(JSON.stringify(requestBody))
                .build()
        )

        Expect(response.statusCode).toEqual(400)

        Expect(JSON.parse(response.body)).toEqual({
          errors: [
            "property unknownField should not exist"
          ]
        })
    }

    @Test()
    public async when_request_with_body_made_for_decorator_route_and_forbidNonWhitelisted_is_false_then_body_is_validated_and_but_ignores_extra_props() {
        let requestBody = {
            id: 23,
            name: "ezra",
            unknownField: 100
        }

        let response = await this.sendRequest(
            RequestBuilder.do("POST", "/test/methods/post-validated-no-whitelist")
                .body(JSON.stringify(requestBody))
                .build()
        )

        Expect(response.statusCode).toEqual(200)

        Expect(response.body).toEqual("23/ezra")
    }

    @Test()
    public async when_request_with_binary_body_made_for_decorator_route_then_app_passes_raw_body_to_endpoint_and_returns_http_status_200_ok() {
        let response: ApiResponse
        let fileContent = readFileSync(ApiAcceptanceTests.TEST_FILE_PATH)

        response = await this.sendRequest(
            RequestBuilder.post("/test/methods/post-raw")
                .binaryBody(fileContent)
                .build()
        )

        Expect(response.statusCode).toEqual(200)
        Expect(response.isBase64Encoded).toBe(true)

        let outputFile = openTempFileSync()

        writeFileSync(outputFile.path, Buffer.from(response.body, "base64"))

        Expect(
            statFileSync(outputFile.path).size
        ).toBe(
            ApiAcceptanceTests.TEST_FILE_SIZE
        )

        Expect(
            calculateFileMd5Sync(outputFile.path)
        ).toBe(
            ApiAcceptanceTests.TEST_FILE_MD5
        )
    }


    @Test()
    public async when_delete_request_made_then_app_returns_http_status_204_no_content() {
        let response = await this.sendRequest(
            RequestBuilder.delete("/test/methods/delete").build()
        )

        Expect(response.statusCode).toEqual(204)
    }

    @Test()
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

    @Test()
    public async when_request_made_for_endpoint_that_does_not_return_response_then_app_returns_http_status_500(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get("/test/no-return").build()
        )

        Expect(response.statusCode).toEqual(500)
    }

    @TestCase("/test/path-test")
    @TestCase("/test/injected-path-test")
    @Test()
    public async when_request_made_with_path_param_then_app_passes_value_to_endpoint(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(`${path}/steve/37`).build()
        )

        Expect(response.body).toEqual("Hey steve, you are 37")
    }

    @TestCase("/test/query-test")
    @TestCase("/test/injected-query-test")
    @Test()
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
    @Test()
    public async when_request_made_with_header_then_app_passes_value_to_endpoint(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(path)
                .header("x-test-header", "header_value")
                .build()
        )

        Expect(response.body).toEqual("Header: header_value")
    }

    @Test()
    public async when_controller_produces_decorator_present_then_response_content_type_header_is_correct() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test").build()
        )

        Expect(response.headers["content-type"]).toEqual("text/plain")
    }

    @Test()
    public async when_controller_produces_decorator_present_then_response_body_is_correct() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test").build()
        )

        Expect(response.body).toEqual("OK")
    }

    @Test()
    public async when_endpoint_produces_decorator_present_then_response_content_type_header_is_correct() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test/produces").build()
        )

        Expect(response.headers["content-type"]).toEqual("application/json")
    }

    @Test()
    public async when_endpoint_produces_decorator_present_then_response_body_is_correct() {
        let response = await this.sendRequest(
            RequestBuilder.get("/test/produces").build()
        )

        Expect(JSON.parse(response.body)).toEqual({
            some: "value"
        })
    }

    @TestCase([""])
    @TestCase(["   "])
    @TestCase(null)
    @TestCase(undefined)
    @Test()
    public when_app_built_with_invalid_controller_path_then_error_is_thrown(controllerPath: string[]) {
        Expect(() => new ApiLambdaApp(controllerPath) ).toThrow()
    }

    @Test()
    public async when_app_built_with_missing_controller_path_then_error_is_thrown() {
        await Expect(async () =>
            await (new ApiLambdaApp(["/some/fake/path"])).initialiseControllers()
        ).toThrowAsync()
    }
}
