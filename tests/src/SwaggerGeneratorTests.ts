import { AsyncSetup, AsyncTest, Expect, TestCase, TestFixture } from "alsatian"

import { buildApiSwaggerSpec } from "../../dist/typescript-lambda-api"

import { TestBase } from "./TestBase"
import { OpenAPIObject } from "openapi3-ts"

@TestFixture()
export class SwaggerGeneratorTests extends TestBase {
    @AsyncSetup
    public async setup() {
        super.setup()

        await this.app.initialiseControllers()
    }

    @AsyncTest()
    public async when_swagger_spec_generated_then_it_contains_all_registered_endpoints() {
        let spec: OpenAPIObject = buildApiSwaggerSpec()

        Expect(Object.keys(spec.paths).length).toBe(24)
    }
}
