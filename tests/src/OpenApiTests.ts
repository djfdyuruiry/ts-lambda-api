import { Expect, Setup, Test, TestCase, TestFixture } from "alsatian"
import { safeLoad } from "js-yaml"
import { OpenAPIObject, SecuritySchemeObject, PathItemObject, ParameterObject, ResponseObject, RequestBodyObject, OperationObject, MediaTypeObject, SchemaObject } from "openapi3-ts"

import { RequestBuilder, ApiLambdaApp } from "../../dist/ts-lambda-api"

import { TestBase } from "./TestBase"
import { TestAuthFilter } from "./test-components/TestAuthFilter";
import { ResponseWithValue } from './test-components/model/ResponseWithValue';
import { TestCustomAuthFilter } from "./test-components/TestCustomAuthFilter";

@TestFixture()
export class OpenApiTests extends TestBase {
    private static readonly ROUTE_COUNT = 57
    private static readonly HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"]

    @Setup
    public async setup() {
        super.setup({
            name: "Test API",
            version: "v1",
            openApi: {
                enabled: true
            }
        })

        await this.app.initialiseControllers()
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_request_to_openapi_spec_returns_200_ok(specFormat: string) {
        let response = await this.requestOpenApiSpec(specFormat)

        Expect(response.statusCode).toEqual(200)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_api_info(specFormat: string) {
        let response = await this.requestParsedOpenApiSpec(specFormat)

        Expect(response.value.info.title).toEqual("Test API")
        Expect(response.value.info.version).toEqual("v1")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_and_base_url_defined_then_openapi_spec_contains_server_with_base_url(specFormat: string) {
        super.setup({
            name: "Test API",
            version: "v1",
            base: "/api/v1",
            openApi: {
                enabled: true
            }
        })

        await this.app.initialiseControllers()

        let response = await this.requestParsedOpenApiSpec(specFormat)

        Expect(response.value.servers).not.toBeEmpty()
        Expect(response.value.servers[0].url).toEqual("/api/v1")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
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
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_operation_name(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "get")

        Expect(endpoint.summary).toBe("get stuff")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_operation_description(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "get")

        Expect(endpoint.description).toBe("go get some stuff")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_api_name(specFormat: string) {
        let response = await this.requestParsedOpenApiSpec(specFormat)
        let tag = response.value.tags.find(t => t.name === "Open API Test")

        Expect(tag).toBeDefined()
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_api_description(specFormat: string) {
        let response = await this.requestParsedOpenApiSpec(specFormat)
        let tag = response.value.tags.find(t => t.name === "Open API Test")

        Expect(tag.description).toBe("Endpoints with OpenAPI decorators")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_open_api_enabled_and_controller_is_marked_ignored_then_openapi_spec_does_not_contain_api(specFormat: string) {
      let response = await this.requestParsedOpenApiSpec(specFormat)
      let paths = Object.keys(response.value.paths);

      Expect(paths).not.toContain('/test/internal/header')
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_open_api_enabled_and_endpoint_is_marked_ignored_then_openapi_spec_does_not_contain_endpoint(specFormat: string) {
      let response = await this.requestParsedOpenApiSpec(specFormat)
      let paths = Object.keys(response.value.paths);

      Expect(paths).toContain('/test/part-internal/public')
      Expect(paths).not.toContain('/test/part-internal/private')
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_parameters(specFormat: string) {
        let pathEndpoint = await this.getOpenApiEndpoint(specFormat, "/test/path-test/{name}/{age}", "get")

        Expect(pathEndpoint.parameters).toBeDefined()
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_multiple_parameters(specFormat: string) {
        let pathEndpoint = await this.getOpenApiEndpoint(specFormat, "/test/path-test/{name}/{age}", "get")

        Expect(pathEndpoint.parameters.length).toBe(2)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_header_parameters(specFormat: string) {
        let headerEndpoint = await this.getOpenApiEndpoint(specFormat, "/test/header-test", "get")
        let headerParameter = headerEndpoint.parameters[0] as ParameterObject

        Expect(headerParameter.in).toEqual("header")
        Expect(headerParameter.name).toEqual("x-test-header")
        Expect(headerParameter.schema).toEqual({})
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_header_parameters_with_info(specFormat: string) {
        let pathEndpoint: PathItemObject = await this.getOpenApiEndpoint(specFormat, "/test/open-api/header-info-test", "get")
        let headerParameter = pathEndpoint.parameters[0] as ParameterObject
        let schema: SchemaObject = headerParameter.schema

        Expect(headerParameter.in).toEqual("header")
        Expect(headerParameter.name).toEqual("x-test-header")
        Expect(headerParameter.description).toEqual("test header param")
        Expect(schema).toEqual({
            example: "\"a string\"",
            type: "string"
        })

        headerParameter = pathEndpoint.parameters[1] as ParameterObject
        schema = headerParameter.content["application/json"].schema

        Expect(headerParameter.in).toEqual("header")
        Expect(headerParameter.name).toEqual("x-test-header2")
        Expect(headerParameter.description).toEqual("test header param 2")
        Expect(schema.type).toEqual("object")
        Expect(schema.properties).toEqual({
            "name": {
                "type": "string",
                "example": "name"
            },
            "age": {
                "type": "number",
                "example": 18
            },
            "location": {
                "type": "object",
                "example": "{\n  \"city\": \"city\",\n  \"country\": \"country\",\n  \"localeCodes\": [\n    10,\n    20,\n    30\n  ]\n}",
                "properties": {
                    "city": {
                        "type": "string",
                        "example": "city"
                    },
                    "country": {
                        "type": "string",
                        "example": "country"
                    },
                    "localeCodes": {
                        "type": "array",
                        "example": "[\n  10,\n  20,\n  30\n]",
                        "items": {
                            "type": "number",
                            "example": 10
                        }
                    }
                }
            },
            "roles": {
                "type": "array",
                "example": "[\n  \"role1\",\n  \"role2\",\n  \"roleN\"\n]",
                "items": {
                    "type": "string",
                    "example": "role1"
                }
            }
        })
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_path_parameters(specFormat: string) {
        let pathEndpoint: PathItemObject = await this.getOpenApiEndpoint(specFormat, "/test/path-test/{name}/{age}", "get")
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
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_path_parameters_with_info(specFormat: string) {
        let pathEndpoint: PathItemObject = await this.getOpenApiEndpoint(specFormat, "/test/open-api/path-info-test/{pathTest}", "get")
        let pathParameter = pathEndpoint.parameters[0] as ParameterObject
        let contentSchema = pathParameter.schema

        Expect(pathParameter.in).toEqual("path")
        Expect(pathParameter.name).toEqual("pathTest")
        Expect(pathParameter.description).toEqual("test path param")
        Expect(pathParameter.required).toEqual(true)
        Expect(contentSchema).toEqual({
            example: "\"a string\"",
            type: "string"
        })
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_query_parameters(specFormat: string) {
        let pathEndpoint: PathItemObject = await this.getOpenApiEndpoint(specFormat, "/test/query-test", "get")
        let queryParameter = pathEndpoint.parameters[0] as ParameterObject

        Expect(queryParameter.in).toEqual("query")
        Expect(queryParameter.name).toEqual("magic")
        Expect(queryParameter.schema).toEqual({})
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_query_parameters_with_info(specFormat: string) {
        let pathEndpoint: PathItemObject = await this.getOpenApiEndpoint(specFormat, "/test/open-api/query-info-test", "get")
        let queryParameter = pathEndpoint.parameters[0] as ParameterObject
        let schema: SchemaObject = queryParameter.schema

        Expect(queryParameter.in).toEqual("query")
        Expect(queryParameter.name).toEqual("queryTest")
        Expect(queryParameter.description).toEqual("test query param")
        Expect(schema).toEqual({
            example: "1",
            type: "number"
        })

        queryParameter = pathEndpoint.parameters[1] as ParameterObject
        schema = queryParameter.schema

        Expect(queryParameter.in).toEqual("query")
        Expect(queryParameter.name).toEqual("queryTest2")
        Expect(queryParameter.description).toEqual("test query param 2")
        Expect(queryParameter.required).toEqual(true)
        Expect(queryParameter.style).toEqual("pipeDelimited")
        Expect(queryParameter.explode).toEqual(false)
        Expect(queryParameter.example).toEqual("1|2|3")
        Expect(schema).toEqual({
            type: "array",
            items: {
                type: "number"
            }
        })
    }

    @TestCase("json", {path: "/test/consumes", contentType: "text/plain"})
    @TestCase("json", {path: "/test/consumes/xml", contentType: "application/xml"})
    @TestCase("json", {path: "/test/open-api", contentType: "application/json"})
    @TestCase("yml", {path: "/test/consumes", contentType: "text/plain"})
    @TestCase("yml", {path: "/test/consumes/xml", contentType: "application/xml"})
    @TestCase("yml", {path: "/test/open-api", contentType: "application/json"})
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_request_content_type(specFormat: string, params: any) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, params.path, "post")
        let requestBody = endpoint.requestBody as RequestBodyObject

        Expect(requestBody.content).toBeDefined()
        Expect(requestBody.content[params.contentType]).toBeDefined()
        Expect(requestBody.description).toEqual("")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_request_content(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")
        let request = endpoint.requestBody as RequestBodyObject

        Expect(request.content["application/json"]).toBeDefined()
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_request_example(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")
        let request = endpoint.requestBody as RequestBodyObject
        let requestContent: MediaTypeObject = request.content["application/json"]

        Expect(requestContent.example).toBe(`{
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
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_request_schema(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")
        let request = endpoint.requestBody as RequestBodyObject
        let requestContent: MediaTypeObject = request.content["application/json"]
        let schema: SchemaObject = requestContent.schema

        Expect(schema.type).toEqual("object")
        Expect(schema.properties).toEqual({
            "name": {
                "type": "string",
                "example": "name"
            },
            "age": {
                "type": "number",
                "example": 18
            },
            "location": {
                "type": "object",
                "example": "{\n  \"city\": \"city\",\n  \"country\": \"country\",\n  \"localeCodes\": [\n    10,\n    20,\n    30\n  ]\n}",
                "properties": {
                    "city": {
                        "type": "string",
                        "example": "city"
                    },
                    "country": {
                        "type": "string",
                        "example": "country"
                    },
                    "localeCodes": {
                        "type": "array",
                        "example": "[\n  10,\n  20,\n  30\n]",
                        "items": {
                            "type": "number",
                            "example": 10
                        }
                    }
                }
            },
            "roles": {
                "type": "array",
                "example": "[\n  \"role1\",\n  \"role2\",\n  \"roleN\"\n]",
                "items": {
                    "type": "string",
                    "example": "role1"
                }
            }
        })
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_request_example_for_primitive_types(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/plain", "post")
        let request = endpoint.requestBody as RequestBodyObject
        let requestContent: MediaTypeObject = request.content["text/plain"]

        Expect(requestContent.example).toBe(`"a string"`)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_request_schema_for_primitive_types(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/plain", "post")
        let request = endpoint.requestBody as RequestBodyObject
        let requestContent: MediaTypeObject = request.content["text/plain"]
        let schema: SchemaObject = requestContent.schema

        Expect(schema.type).toEqual("string")
        Expect(schema.example).toEqual(`"a string"`)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_custom_request_examples(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/custom-info", "post")
        let request = endpoint.requestBody as RequestBodyObject
        let content: MediaTypeObject = request.content["application/json"]

        Expect(content.example).toEqual(`{"name": "some name", "age": 22}`)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_custom_request_descriptions(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/custom-info", "post")
        let request = endpoint.requestBody as RequestBodyObject

        Expect(request.description).toEqual(`Details for a person`)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_request_schema_for_files(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/files", "post")
        let request = endpoint.requestBody as RequestBodyObject
        let content = request.content["application/octet-stream"]
        let schema = content.schema as SchemaObject

        Expect(schema.type).toEqual("string")
        Expect(schema.format).toEqual("binary")
    }

    @TestCase("json", {path: "/test", contentType: "text/plain"})
    @TestCase("json", {path: "/test/ei-decorator", contentType: "application/json"})
    @TestCase("json", {path: "/test/open-api", contentType: "application/json"})
    @TestCase("json", {path: "/test/produces", contentType: "application/json"})
    @TestCase("yml", {path: "/test", contentType: "text/plain"})
    @TestCase("yml", {path: "/test/ei-decorator", contentType: "application/json"})
    @TestCase("yml", {path: "/test/open-api", contentType: "application/json"})
    @TestCase("yml", {path: "/test/produces", contentType: "application/json"})
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_response_content_type(specFormat: string, params: any) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, params.path, "get")
        let defaultResponse = endpoint.responses.default as ResponseObject

        Expect(defaultResponse.content).toBeDefined()
        Expect(defaultResponse.content[params.contentType]).toBeDefined()
        Expect(defaultResponse.description).toEqual("")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_response_per_status_code(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")

        Expect(endpoint.responses["201"]).toBeDefined()
        Expect(endpoint.responses["400"]).toBeDefined()
        Expect(endpoint.responses["500"]).toBeDefined()
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_response_content_per_status_code(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")

        Expect(endpoint.responses["201"].content["application/json"]).toBeDefined()
        Expect(endpoint.responses["400"].content["application/json"]).toBeDefined()
        Expect(endpoint.responses["500"].content["application/json"]).toBeDefined()
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
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
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_response_schema(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "post")
        let response_201: ResponseObject = endpoint.responses["201"]
        let content_201: MediaTypeObject = response_201.content["application/json"]
        let schema_201: SchemaObject = content_201.schema

        Expect(schema_201.type).toEqual("object")
        Expect(schema_201.properties).toEqual({
            "name": {
                "type": "string",
                "example": "name"
            },
            "age": {
                "type": "number",
                "example": 18
            },
            "location": {
                "type": "object",
                "example": "{\n  \"city\": \"city\",\n  \"country\": \"country\",\n  \"localeCodes\": [\n    10,\n    20,\n    30\n  ]\n}",
                "properties": {
                    "city": {
                        "type": "string",
                        "example": "city"
                    },
                    "country": {
                        "type": "string",
                        "example": "country"
                    },
                    "localeCodes": {
                        "type": "array",
                        "example": "[\n  10,\n  20,\n  30\n]",
                        "items": {
                            "type": "number",
                            "example": 10
                        }
                    }
                }
            },
            "roles": {
                "type": "array",
                "example": "[\n  \"role1\",\n  \"role2\",\n  \"roleN\"\n]",
                "items": {
                    "type": "string",
                    "example": "role1"
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
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_response_example_for_primitive_types(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "get")
        let response: ResponseObject = endpoint.responses["200"]
        let content: MediaTypeObject = response.content["application/json"]

        Expect(content.example).toBe(`"a string"`)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_response_schema_for_primitive_types(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api", "get")
        let response: ResponseObject = endpoint.responses["200"]
        let content: MediaTypeObject = response.content["application/json"]
        let schema: SchemaObject = content.schema

        Expect(schema.type).toEqual("string")
        Expect(schema.example).toEqual(`"a string"`)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_response_schema_for_primitive_class_examples(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/primitive-class-example", "get")
        let response: ResponseObject = endpoint.responses["200"]
        let content: MediaTypeObject = response.content["application/json"]
        let schema: SchemaObject = content.schema

        Expect(content.example).toEqual(30)

        Expect(schema.type).toEqual("number")
        Expect(schema.example).toEqual(30)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_response_schema_for_primitive_class_array_examples(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/primitive-array-class-example", "get")
        let response: ResponseObject = endpoint.responses["200"]
        let content: MediaTypeObject = response.content["application/json"]
        let schema: SchemaObject = content.schema

        Expect(content.example).toEqual(`[
  "a",
  "b"
]`)

        Expect(schema.type).toEqual("array")
        Expect(schema.example).toEqual(`[
  "a",
  "b"
]`)

        let itemSchema = schema.items as SchemaObject

        Expect(itemSchema.type).toEqual("string")
        Expect(itemSchema.example).toEqual("a")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_custom_response_examples(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/custom-info", "post")
        let response_201: ResponseObject = endpoint.responses["201"]
        let content_201: MediaTypeObject = response_201.content["application/json"]

        Expect(content_201.example).toEqual(`{"name": "another name", "age": 30}`)

        let response_400: ResponseObject = endpoint.responses["400"]
        let content_400: MediaTypeObject = response_400.content["application/json"]

        Expect(content_400.example).toEqual(`{"statusCode": 400, "error": "you screwed up"}`)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_custom_response_descriptions(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/custom-info", "post")
        let response_201: ResponseObject = endpoint.responses["201"]

        Expect(response_201.description).toEqual("Uploaded person information")

        let response_400: ResponseObject = endpoint.responses["400"]

        Expect(response_400.description).toEqual("A bad request error message")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_schemas_for_files(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/files", "post")
        let response = endpoint.responses["201"] as ResponseObject
        let content = response.content["application/octet-stream"]
        let schema = content.schema as SchemaObject

        Expect(schema.type).toEqual("string")
        Expect(schema.format).toEqual("binary")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_schemas_for_constructor_only_types(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/constructor", "get")
        let response = endpoint.responses["200"] as ResponseObject
        let content = response.content["application/json"]
        let schema = content.schema as SchemaObject

        Expect(schema.type).toEqual("object")
        Expect(schema.properties).toEqual({
            "field": {
                "type": "string",
                "example": ""
            }
        })
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_ignores_null_fields(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/null-fields", "get")
        let response = endpoint.responses["200"] as ResponseObject
        let content = response.content["application/json"]
        let schema = content.schema as SchemaObject

        Expect(schema.type).toEqual("object")
        Expect(schema.properties).toEqual({
          "populatedField": {
            "type": "number",
            "example": 30
          },
          "emptyString": {
            "type": "string",
            "example": ""
          }
        })
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_schemas_without_unsupported_array_types(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/edge-case", "get")
        let response = endpoint.responses["200"] as ResponseObject
        let content = response.content["application/json"]
        let schema = content.schema as SchemaObject

        Expect(schema.type).toEqual("object")
        Expect(Object.keys(schema.properties)).not.toContain("invalidArray")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_schemas_with_object_array_types(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/edge-case", "get")
        let response = endpoint.responses["200"] as ResponseObject
        let content = response.content["application/json"]
        let schema = content.schema as SchemaObject

        Expect(schema.type).toEqual("object")
        Expect(Object.keys(schema.properties)).toContain("arrayOfObjects")

        let arrayOfObjectsSchema = schema.properties["arrayOfObjects"] as SchemaObject

        Expect(arrayOfObjectsSchema.type).toEqual("array")

        let arrayOfObjectsItemsSchema = arrayOfObjectsSchema.items as SchemaObject

        Expect(arrayOfObjectsItemsSchema.type).toEqual("object")
        Expect(arrayOfObjectsItemsSchema.properties).toEqual({
            "field1": {
                "type": "string",
                "example": "field1"
            },
            "field2": {
                "type": "number",
                "example": 2
            },
            "field3": {
                "type": "array",
                "example": "[\n  1,\n  2,\n  3\n]",
                "items": {
                    "type": "number",
                    "example": 1
                }
            }
        })
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_schemas_with_array_array_types(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/edge-case", "get")
        let response = endpoint.responses["200"] as ResponseObject
        let content = response.content["application/json"]
        let schema = content.schema as SchemaObject

        Expect(schema.type).toEqual("object")
        Expect(Object.keys(schema.properties)).toContain("arrayOfArrays")

        let arrayOfObjectsSchema = schema.properties["arrayOfArrays"] as SchemaObject

        Expect(arrayOfObjectsSchema.type).toEqual("array")
        Expect(arrayOfObjectsSchema.items).toEqual({
            "type": "array",
            "example": "[\n  \"a\",\n  \"b\",\n  \"c\"\n]",
            "items": {
                "type": "string",
                "example": "a"
            }
        })
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_schemas_with_example_object_array_types_at_root(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/example-array-objects", "get")
        let response = endpoint.responses["200"] as ResponseObject
        let content = response.content["application/json"]
        let schema = content.schema as SchemaObject

        Expect(schema.type).toEqual("array")
        Expect(schema.example).toEqual(`[
  {},
  {},
  {}
]`)

        let arrayItemsSchema = schema.items as SchemaObject

        Expect(arrayItemsSchema.type).toEqual("object")
        Expect(arrayItemsSchema.additionalProperties).toEqual(true)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_schemas_with_object_array_types_at_root(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/open-api/array-objects", "get")
        let response = endpoint.responses["200"] as ResponseObject
        let content = response.content["application/json"]
        let schema = content.schema as SchemaObject

        Expect(schema.type).toEqual("array")

        Expect(schema.example).toEqual(`[
  {
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
  },
  {
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
  },
  {
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
  }
]`)

        let arrayItemsSchema = schema.items as SchemaObject

        Expect(arrayItemsSchema.type).toEqual("object")
        Expect(arrayItemsSchema.example).toEqual(`{
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
        Expect(arrayItemsSchema.properties).toEqual({
            "name": {
                "type": "string",
                "example": "name"
            },
            "age": {
                "type": "number",
                "example": 18
            },
            "location": {
                "type": "object",
                "example": "{\n  \"city\": \"city\",\n  \"country\": \"country\",\n  \"localeCodes\": [\n    10,\n    20,\n    30\n  ]\n}",
                "properties": {
                    "city": {
                        "type": "string",
                        "example": "city"
                    },
                    "country": {
                        "type": "string",
                        "example": "country"
                    },
                    "localeCodes": {
                        "type": "array",
                        "example": "[\n  10,\n  20,\n  30\n]",
                        "items": {
                            "type": "number",
                            "example": 10
                        }
                    }
                }
            },
            "roles": {
                "type": "array",
                "example": "[\n  \"role1\",\n  \"role2\",\n  \"roleN\"\n]",
                "items": {
                    "type": "string",
                    "example": "role1"
                }
            }
        })
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_then_openapi_spec_contains_empty_security_for_no_auth_endpoints(specFormat: string) {
        let endpoint = await this.getOpenApiEndpoint(specFormat, "/test/no-auth", "get")

        Expect(endpoint.security).toBeDefined()
        Expect(endpoint.security).toBeEmpty()
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_and_basic_auth_filter_defined_then_openapi_spec_contains_security_scheme(specFormat: string) {
        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.requestParsedOpenApiSpec(specFormat)

        let securitySchemes = Object.keys(response.value.components.securitySchemes)

        Expect(securitySchemes).toContain("basic")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_and_basic_auth_filter_defined_then_openapi_spec_contains_http_basic_security_scheme(specFileFormat: string) {
        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.requestParsedOpenApiSpec(specFileFormat)
        let spec = response.value

        let scheme = spec.components.securitySchemes["basic"] as SecuritySchemeObject

        Expect(scheme.type).toEqual("http")
        Expect(scheme.scheme).toEqual("basic")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_and_custom_auth_filter_defined_then_openapi_spec_contains_security_scheme(specFileFormat: string) {
        this.app.middlewareRegistry.addAuthFilter(new TestCustomAuthFilter("luke"))

        let response = await this.requestParsedOpenApiSpec(specFileFormat)
        let securitySchemes = Object.keys(response.value.components.securitySchemes)

        Expect(securitySchemes).toContain("bearerAuth")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_and_custom_auth_filter_defined_then_openapi_spec_contains_custom_security_scheme(specFileFormat: string) {
        this.app.middlewareRegistry.addAuthFilter(new TestCustomAuthFilter("luke"))

        let response = await this.requestParsedOpenApiSpec(specFileFormat)
        let spec = response.value

        let scheme = spec.components.securitySchemes["bearerAuth"] as SecuritySchemeObject

        Expect(scheme.type).toEqual("http")
        Expect(scheme.scheme).toEqual("bearer")
        Expect(scheme.bearerFormat).toEqual("JWT")
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_and_basic_auth_filter_and_custom_auth_filter_defined_then_openapi_spec_contains_both_security_scheme(specFormat: string) {
        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))
        this.app.middlewareRegistry.addAuthFilter(new TestCustomAuthFilter("luke"))

        let response = await this.requestParsedOpenApiSpec(specFormat)

        let securitySchemes = Object.keys(response.value.components.securitySchemes)

        Expect(securitySchemes).toContain("basic")
        Expect(securitySchemes).toContain("bearerAuth")
    }


    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_with_auth_and_basic_auth_filter_defined_and_request_is_unauthorized_then_openapi_spec_request_returns_401_unauthroized(specFileFormat: string) {
        this.appConfig.openApi = {
            enabled: true,
            useAuthentication: true
        }

        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, this.appConfig)

        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.requestOpenApiSpec(specFileFormat)

        Expect(response.statusCode).toEqual(401)
    }

    @TestCase("json")
    @TestCase("yml")
    @Test()
    public async when_openapi_enabled_with_auth_and_basic_auth_filter_defined_and_request_is_authorized_then_openapi_spec_request_returns_200_ok(specFileFormat: string) {
        this.appConfig.openApi = {
            enabled: true,
            useAuthentication: true
        }

        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, this.appConfig)

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
            RequestBuilder.get(`${this.appConfig.base || ""}/open-api.${specFileFormat}`).build()
        )

        if (derserialize) {
            if (specFileFormat === "json") {
                response.value = JSON.parse(response.body)
            } else {
                response.value = safeLoad(response.body) as any
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
