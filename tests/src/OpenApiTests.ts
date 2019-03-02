import { AsyncSetup, AsyncTest, Expect, TestCase, TestFixture } from "alsatian"
import { safeLoad } from "js-yaml"
import { OpenAPIObject, SecuritySchemeObject } from "openapi3-ts"

import { RequestBuilder, ApiLambdaApp } from "../../dist/typescript-lambda-api"

import { TestBase } from "./TestBase"
import { TestAuthFilter } from "./test-components/TestAuthFilter";

@TestFixture()
export class OpenApiTests extends TestBase {
    @AsyncSetup
    public async setup() {
        super.setup({
            openApi: {
                enabled: true
            }
        })

        await this.app.initialiseControllers()
    }

    @TestCase("open-api.json")
    @TestCase("open-api.yml")
    @AsyncTest()
    public async when_openapi_enabled_then_request_to_openapi_spec_returns_200_ok(specFileName: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(`/${specFileName}`).build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    @TestCase("open-api.json", JSON.parse)
    @TestCase("open-api.yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_then_openapi_spec_contains_all_declared_endpoints(specFileName: string, deserialize: (body: string) => OpenAPIObject) {
        let response = await this.sendRequest(
            RequestBuilder.get(`/${specFileName}`).build()
        )

        let spec: OpenAPIObject = deserialize(response.body)

        Expect(Object.keys(spec.paths).length).toBe(26)
    }

    @TestCase("open-api.json", JSON.parse)
    @TestCase("open-api.yml", safeLoad)
    @AsyncTest()
    public async when_openapi_enabled_and_basic_auth_filter_defined_then_openapi_spec_contains_security_scheme(specFileName: string, deserialize: (body: string) => OpenAPIObject) {
        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.sendRequest(
            RequestBuilder.get(`/${specFileName}`).build()
        )

        let spec: OpenAPIObject = deserialize(response.body)
        let securitySchemes = Object.keys(spec.components.securitySchemes)

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

    @TestCase("open-api.json")
    @TestCase("open-api.yml")
    @AsyncTest()
    public async when_openapi_enabled_with_auth_and_basic_auth_filter_defined_and_request_is_unauthorized_then_openapi_spec_request_returns_401_unauthroized(specFileName: string) {
        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, {
            openApi: {
                enabled: true,
                useAuthentication: true
            }
        })

        this.app.middlewareRegistry.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.sendRequest(
            RequestBuilder.get(`/${specFileName}`).build()
        )

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
}
