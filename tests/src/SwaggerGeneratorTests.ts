import { AsyncSetup, AsyncTest, Expect, TestCase, TestFixture } from "alsatian"
import { safeLoad } from "js-yaml"
import { OpenAPIObject, SecuritySchemeObject } from "openapi3-ts"

import { RequestBuilder } from "../../dist/typescript-lambda-api"

import { TestBase } from "./TestBase"
import { TestAuthFilter } from "./test-components/TestAuthFilter";

@TestFixture()
export class SwaggerGeneratorTests extends TestBase {
    @AsyncSetup
    public async setup() {
        super.setup({
            swagger: {
                enabled: true
            }
        })

        await this.app.initialiseControllers()
    }

    @TestCase("swagger.json")
    @TestCase("swagger.yml")
    @AsyncTest()
    public async when_swagger_enabled_then_request_to_swagger_spec_returns_200_ok(specFileName: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(`/${specFileName}`).build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    @TestCase("swagger.json", JSON.parse)
    @TestCase("swagger.yml", safeLoad)
    @AsyncTest()
    public async when_swagger_enabled_then_swagger_spec_contains_all_declared_endpoints(specFileName: string, deserialize: (body: string) => OpenAPIObject) {
        let response = await this.sendRequest(
            RequestBuilder.get(`/${specFileName}`).build()
        )

        let spec: OpenAPIObject = deserialize(response.body)

        Expect(Object.keys(spec.paths).length).toBe(24)
    }

    @AsyncTest()
    public async when_swagger_enabled_and_basic_auth_filter_defined_then_swagger_spec_contains_basic_security() {
        let authFilter = new TestAuthFilter("luke", "vaderismydad")

        this.app.middlewareRegistry.addAuthFilter(authFilter)

        let response = await this.sendRequest(
            RequestBuilder.get(`/swagger.json`).build()
        )

        let spec: OpenAPIObject = JSON.parse(response.body)

        Expect(spec.components.securitySchemes).toBeDefined()

        let securitySchemes = Object.keys(spec.components.securitySchemes)

        Expect(securitySchemes).toContain("basic")

        let scheme = spec.components.securitySchemes["basic"] as SecuritySchemeObject

        Expect(scheme.type).toEqual("http")
        Expect(scheme.scheme).toEqual("Basic")
    }
}
