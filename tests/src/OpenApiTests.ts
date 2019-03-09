import { AsyncSetup, AsyncTest, Expect, TestCase, TestFixture } from "alsatian"
import { safeLoad } from "js-yaml"
import { OpenAPIObject, SecuritySchemeObject, PathItemObject, ParameterObject, ResponseObject, RequestBodyObject, OperationObject, MediaTypeObject, SchemaObject } from "openapi3-ts"

import { RequestBuilder, ApiLambdaApp } from "../../dist/typescript-lambda-api"

import { TestBase } from "./TestBase"
import { TestAuthFilter } from "./test-components/TestAuthFilter";
import { ResponseWithValue } from './test-components/model/ResponseWithValue';

@TestFixture()
export class OpenApiTests extends TestBase {
    private static readonly ROUTE_COUNT = 39
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

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_all_declared_endpoints(specFormat: string) {
        let response = await this.requestParsedOpenApiSpec(specFormat)
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

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_parameters(specFormat: string) {
        let pathEndpoint = await this.getOpenApiEndpoint(specFormat, "/test/path-test/:name/:age", "get")

        Expect(pathEndpoint.parameters).toBeDefined()
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_multiple_parameters(specFormat: string) {
        let pathEndpoint = await this.getOpenApiEndpoint(specFormat, "/test/path-test/:name/:age", "get")

        Expect(pathEndpoint.parameters.length).toBe(2)
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_header_parameters(specFormat: string) {
        let headerEndpoint = await this.getOpenApiEndpoint(specFormat, "/test/header-test", "get")
        let headerParameter = headerEndpoint.parameters[0] as ParameterObject

        Expect(headerParameter.in).toEqual("header")
        Expect(headerParameter.name).toEqual("x-test-header")
        Expect(headerParameter.schema).toEqual({})
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_path_parameters(specFormat: string) {
        let pathEndpoint: PathItemObject = await this.getOpenApiEndpoint(specFormat, "/test/path-test/:name/:age", "get")
        let nameParameter = pathEndpoint.parameters[0] as ParameterObject
        let ageParameter = pathEndpoint.parameters[1] as ParameterObject

        Expect(nameParameter.in).toEqual("path")
        Expect(nameParameter.name).toEqual("name")
        Expect(nameParameter.required).toBe(true)
        Expect(nameParameter.schema).toEqual({})

        Expect(ageParameter.in).toEqual("path")
        Expect(ageParameter.name).toEqual("age")
        Expect(ageParameter.required).toBe(true)
        Expect(ageParameter.schema).toEqual({})
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_query_parameters(specFormat: string) {
        let pathEndpoint: PathItemObject = await this.getOpenApiEndpoint(specFormat, "/test/query-test", "get")
        let queryParameter = pathEndpoint.parameters[0] as ParameterObject

        Expect(queryParameter.in).toEqual("query")
        Expect(queryParameter.name).toEqual("magic")
        Expect(queryParameter.schema).toEqual({})
    }

    @TestCase("json", {path: "/test/consumes", contentType: "text/plain"})
    @TestCase("json", {path: "/test/consumes/xml", contentType: "application/xml"})
    @TestCase("json", {path: "/test/open-api", contentType: "application/json"})
    @TestCase("yml", {path: "/test/consumes", contentType: "text/plain"})
    @TestCase("yml", {path: "/test/consumes/xml", contentType: "application/xml"})
    @TestCase("yml", {path: "/test/open-api", contentType: "application/json"})
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_request_content_type(specFormat: string, params: any) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, params.path, "post")
        let requestBody = endpoint.requestBody as RequestBodyObject

        Expect(requestBody.content).toBeDefined()
        Expect(Object.keys(requestBody.content)).toContain(params.contentType)
        Expect(requestBody.description).toEqual("")
    }

    @TestCase("json", {path: "/test", contentType: "text/plain"})
    @TestCase("json", {path: "/test/ei-decorator", contentType: "application/json"})
    @TestCase("json", {path: "/test/open-api", contentType: "application/json"})
    @TestCase("json", {path: "/test/produces", contentType: "application/json"})
    @TestCase("yml", {path: "/test", contentType: "text/plain"})
    @TestCase("yml", {path: "/test/ei-decorator", contentType: "application/json"})
    @TestCase("yml", {path: "/test/open-api", contentType: "application/json"})
    @TestCase("yml", {path: "/test/produces", contentType: "application/json"})
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_response_content_type(specFormat: string, params: any) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, params.path, "get")
        let defaultResponse = endpoint.responses.default as ResponseObject

        Expect(defaultResponse.content).toBeDefined()
        Expect(Object.keys(defaultResponse.content)).toContain(params.contentType)
        Expect(defaultResponse.description).toEqual("")
    }

    // TODO: do content schema and example tests for requests

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_response_per_status_code(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")

        Expect(endpoint.responses["201"]).toBeDefined()
        Expect(endpoint.responses["400"]).toBeDefined()
        Expect(endpoint.responses["500"]).toBeDefined()
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_response_content_per_status_code(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")

        Expect(endpoint.responses["201"].content["application/json"]).toBeDefined()
        Expect(endpoint.responses["400"].content["application/json"]).toBeDefined()
        Expect(endpoint.responses["500"].content["application/json"]).toBeDefined()
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_response_example(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")
        let response_201: ResponseObject = endpoint.responses["201"]
        let content_201: MediaTypeObject = response_201.content["application/json"]

        Expect(content_201.example).toBe(`{
    "name": "name",
    "age": 18,
    "location": {
        "city": "city",
        "country": "country",
        "localeCodes": [
            10,
            20,
            30
        ]
    },
    "roles": [
        "role1",
        "role2",
        "roleN"
    ]
}`)

    let response_400: ResponseObject = endpoint.responses["400"]
    let content_400: MediaTypeObject = response_400.content["application/json"]

    Expect(content_400.example).toBe(`{
    "statusCode": 500,
    "error": "error description"
}`)
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_response_schema(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")
        let response_201: ResponseObject = endpoint.responses["201"]
        let content_201: MediaTypeObject = response_201.content["application/json"]
        let schema_201: SchemaObject = content_201.schema

        Expect(schema_201.type).toEqual("object")
        Expect(schema_201.properties).toEqual({
            name: {
                type: "string",
                example: "name"
            },
            age: {
                type: "number",
                example: 18
            },
            location: {
                type: "object",
                example: "{\n    \"city\": \"city\",\n    \"country\": \"country\",\n    \"localeCodes\": [\n        10,\n        20,\n        30\n    ]\n}",
                properties: {
                    city: {
                        type: "string",
                        example: "city"
                    },
                    country: {
                        type: "string",
                        example: "country"
                    },
                    localeCodes: {
                        type: "array",
                        example: "[\n    10,\n    20,\n    30\n]",
                        items: {
                            type: "number",
                            example: 10
                        }
                    }
                }
            },
            roles: {
                type: "array",
                example: "[\n    \"role1\",\n    \"role2\",\n    \"roleN\"\n]",
                items: {
                    type: "string",
                    example: "role1"
                }
            }
        })

        let response_400: ResponseObject = endpoint.responses["400"]
        let content_400: MediaTypeObject = response_400.content["application/json"]
        let schema_400: SchemaObject = content_400.schema

        Expect(schema_400.type).toEqual("object")
        Expect(schema_400.properties).toEqual({
            statusCode: {
                type: "number",
                example: 500
            },
            error: {
                type: "string",
                example: "error description"
            }
        })
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_operation_name(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "get")

        Expect(endpoint.summary).toBe("get stuff")
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_operation_description(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "get")

        Expect(endpoint.description).toBe("go get some stuff")
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_api_name(specFormat: string) {
        let response = await this.requestParsedOpenApiSpec(specFormat)
        let tag = response.value.tags.find(t => t.name === "Open API Test")

        Expect(tag).toBeDefined()
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_api_description(specFormat: string) {
        let response = await this.requestParsedOpenApiSpec(specFormat)
        let tag = response.value.tags.find(t => t.name === "Open API Test")

        Expect(tag.description).toBe("Endpoints with OpenAPI decorators")
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_and_basic_auth_filter_defined_then_openapi_spec_contains_security_scheme(specFormat: string) {
        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.requestParsedOpenApiSpec(specFormat)

        let securitySchemes = Object.keys(response.value.components.securitySchemes)

        Expect(securitySchemes).toContain("basic")
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_and_basic_auth_filter_defined_then_openapi_spec_contains_http_basic_security_scheme(specFileFormat: string) {
        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.requestParsedOpenApiSpec(specFileFormat)
        let spec = response.value

        let scheme = spec.components.securitySchemes["basic"] as SecuritySchemeObject

        Expect(scheme.type).toEqual("http")
        Expect(scheme.scheme).toEqual("Basic")
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_with_auth_and_basic_auth_filter_defined_and_request_is_unauthorized_then_openapi_spec_request_returns_401_unauthroized(specFileFormat: string) {
        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, {
            openApi: {
                enabled: true,
                useAuthentication: true
            }
        })

        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.requestOpenApiSpec(specFileFormat)

        Expect(response.statusCode).toEqual(401)
    }

    @TestCase("json")
    @TestCase("yml")
    @AsyncTest()
    public async when_openapi_enabled_with_auth_and_basic_auth_filter_defined_and_request_is_authorized_then_openapi_spec_request_returns_200_ok(specFileFormat: string) {
        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, {
            openApi: {
                enabled: true,
                useAuthentication: true
            }
        })

        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.sendRequest(
            RequestBuilder.get(`/open-api.${specFileFormat}`)
                .basicAuth("luke", "vaderismydad")
                .build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    private async requestParsedOpenApiSpec(specFileFormat: string = "json") {
        return await this.requestOpenApiSpec(specFileFormat, true)
    }

    private async requestOpenApiSpec(specFileFormat: string = "json", derserialize: boolean = false) {
        let response: ResponseWithValue<OpenAPIObject> = await this.sendRequest(
            RequestBuilder.get(`/open-api.${specFileFormat}`).build()
        )

        if (derserialize) {
            if (specFileFormat === "json") {
                response.value = JSON.parse(response.body)
            } else {
                response.value = safeLoad(response.body)
            }
        }

        return response
    }

    private async getOpenApiEndpoint(specFormat: string, path: string, method: string) {
        let response = await this.requestParsedOpenApiSpec(specFormat)
        let pathEndpoint: PathItemObject = response.value.paths[path]

        return pathEndpoint[method] as OperationObject
    }
}
