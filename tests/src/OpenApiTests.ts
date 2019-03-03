import { AsyncSetup, AsyncTest, Expect, TestCase, TestFixture } from "alsatian"
import { safeLoad } from "js-yaml"
import { OpenAPIObject, SecuritySchemeObject, PathsObject, PathItemObject, ParameterObject, ResponseObject } from "openapi3-ts"

import { RequestBuilder, ApiLambdaApp } from "../../dist/typescript-lambda-api"

import { TestBase } from "./TestBase"
import { TestAuthFilter } from "./test-components/TestAuthFilter";
import { ResponseWithValue } from './test-components/model/ResponseWithValue';

@TestFixture()
export class OpenApiTests extends TestBase {
    private static readonly ROUTE_COUNT = 31
    private static readonly HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"]

    @AsyncSetup
    public async setup() {
        super.setup({
            openApi: {
                enabled: true
            }
        })

        await this.app.initialiseControllers()
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_request_to_openapi_spec_returns_200_ok(specFormat: string) {
        let response = await this.requestOpenApiSpec(specFormat)

        Expect(response.statusCode).toEqual(200)
    }

    @TestCase("json", JSON.parse)
    @TestCase("yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_all_declared_endpoints(specFormat: string, deserialize: (body: string) => OpenAPIObject) {
        let response = await this.requestOpenApiSpec(specFormat, deserialize)
        let paths = response.value.paths
        let actualPathCount = 0

        for (let path in paths) {
            if (!paths.hasOwnProperty(path)) {
                continue
            }

            for (let method in paths[path]) {
                if (!paths[path].hasOwnProperty(method)) {
                    continue
                }

                if (OpenApiTests.HTTP_METHODS.includes(method)) {
                    actualPathCount++
                }
            }
        }

        Expect(actualPathCount).toBe(OpenApiTests.ROUTE_COUNT)
    }

    @TestCase("json", JSON.parse)
    @TestCase("yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_parameters(specFormat: string, deserialize: (body: string) => OpenAPIObject) {
        let response = await this.requestOpenApiSpec(specFormat, deserialize)
        let pathEndpoint: PathItemObject = response.value.paths["/test/path-test/:name/:age"]

        Expect(pathEndpoint["get"].parameters).toBeDefined()
    }

    @TestCase("json", JSON.parse)
    @TestCase("yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_multiple_parameters(specFormat: string, deserialize: (body: string) => OpenAPIObject) {
        let response = await this.requestOpenApiSpec(specFormat, deserialize)
        let pathEndpoint: PathItemObject = response.value.paths["/test/path-test/:name/:age"]

        Expect(pathEndpoint["get"].parameters.length).toBe(2)
    }

    @TestCase("json", JSON.parse)
    @TestCase("yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_header_parameters(specFormat: string, deserialize: (body: string) => OpenAPIObject) {
        let response = await this.requestOpenApiSpec(specFormat, deserialize)
        let headerEndpoint: PathItemObject = response.value.paths["/test/header-test"]
        let headerParameter = headerEndpoint["get"].parameters[0] as ParameterObject

        Expect(headerParameter.in).toEqual("header")
        Expect(headerParameter.name).toEqual("x-test-header")
        Expect(headerParameter.schema).toEqual({})
    }

    @TestCase("json", JSON.parse)
    @TestCase("yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_path_parameters(specFormat: string, deserialize: (body: string) => OpenAPIObject) {
        let response = await this.requestOpenApiSpec(specFormat, deserialize)
        let pathEndpoint: PathItemObject = response.value.paths["/test/path-test/:name/:age"]
        let nameParameter = pathEndpoint["get"].parameters[0] as ParameterObject
        let ageParameter = pathEndpoint["get"].parameters[1] as ParameterObject

        Expect(nameParameter.in).toEqual("path")
        Expect(nameParameter.name).toEqual("name")
        Expect(nameParameter.required).toBe(true)
        Expect(nameParameter.schema).toEqual({})

        Expect(ageParameter.in).toEqual("path")
        Expect(ageParameter.name).toEqual("age")
        Expect(ageParameter.required).toBe(true)
        Expect(ageParameter.schema).toEqual({})
    }

    @TestCase("json", JSON.parse)
    @TestCase("yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_query_parameters(specFormat: string, deserialize: (body: string) => OpenAPIObject) {
        let response = await this.requestOpenApiSpec(specFormat, deserialize)
        let pathEndpoint: PathItemObject = response.value.paths["/test/query-test"]
        let queryParameter = pathEndpoint["get"].parameters[0] as ParameterObject

        Expect(queryParameter.in).toEqual("query")
        Expect(queryParameter.name).toEqual("magic")
        Expect(queryParameter.schema).toEqual({})
    }

    @TestCase("json", JSON.parse)
    @TestCase("yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_response_content_type(specFormat: string, deserialize: (body: string) => OpenAPIObject) {
        let response = await this.requestOpenApiSpec(specFormat, deserialize)
        let pathEndpoint: PathItemObject = response.value.paths["/test"]
        let defaultResponse = pathEndpoint["get"].responses.default as ResponseObject

        Expect(defaultResponse.content).toBeDefined()
        Expect(Object.keys(defaultResponse.content)).toContain("text/plain")
        Expect(defaultResponse.description).toEqual("")
    }

    @TestCase("json", JSON.parse)
    @TestCase("yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_and_basic_auth_filter_defined_then_openapi_spec_contains_security_scheme(specFormat: string, deserialize: (body: string) => OpenAPIObject) {
        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.requestOpenApiSpec(specFormat, deserialize)

        let securitySchemes = Object.keys(response.value.components.securitySchemes)

        Expect(securitySchemes).toContain("basic")
    }

    @TestCase("open-api.json", JSON.parse)
    @TestCase("open-api.yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_and_basic_auth_filter_defined_then_openapi_spec_contains_http_basic_security_scheme(specFileName: string, deserialize: (body: string) => OpenAPIObject) {
        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.sendRequest(
            RequestBuilder.get(`/${specFileName}`).build()
        )

        let spec: OpenAPIObject = deserialize(response.body)
        let scheme = spec.components.securitySchemes["basic"] as SecuritySchemeObject

        Expect(scheme.type).toEqual("http")
        Expect(scheme.scheme).toEqual("Basic")
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_with_auth_and_basic_auth_filter_defined_and_request_is_unauthorized_then_openapi_spec_request_returns_401_unauthroized(specFormat: string) {
        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, {
            openApi: {
                enabled: true,
                useAuthentication: true
            }
        })

        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.requestOpenApiSpec(specFormat)

        Expect(response.statusCode).toEqual(401)
    }

    @TestCase("open-api.json")
    @TestCase("open-api.yml")
    @AsyncTest()
    public async when_openapi_enabled_with_auth_and_basic_auth_filter_defined_and_request_is_authorized_then_openapi_spec_request_returns_200_ok(specFileName: string) {
        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, {
            openApi: {
                enabled: true,
                useAuthentication: true
            }
        })

        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.sendRequest(
            RequestBuilder.get(`/${specFileName}`)
                .basicAuth("luke", "vaderismydad")
                .build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    private async requestOpenApiSpec(specFileFormat: string = "json", deserialize?: (body: string) => OpenAPIObject) {
        let response: ResponseWithValue<OpenAPIObject> = await this.sendRequest(
            RequestBuilder.get(`/open-api.${specFileFormat}`).build()
        )

        if (deserialize) {
            response.value = deserialize(response.body)
        }

        return response
    }
}
