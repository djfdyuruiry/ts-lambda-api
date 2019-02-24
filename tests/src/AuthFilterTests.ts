import { AsyncTest, Expect, TestCase, TestFixture } from "alsatian"

import { RequestBuilder } from "../../dist/typescript-lambda-api"

import { TestBase } from "./TestBase"
import { TestAuthFilter } from "./test-components/TestAuthFilter"

@TestFixture()
export class ApiLambdaAppTests extends TestBase {
    @TestCase(null)
    @TestCase(undefined)
    @AsyncTest()
    public async when_invalid_api_auth_filter_is_passed_to_app_then_throws_an_error(invalidAuthFilter: TestAuthFilter) {
        Expect(() => this.app.middlewareRegistry.addAuthFilter(invalidAuthFilter))
            .toThrow()
    }

    @AsyncTest()
    public async when_api_auth_filter_configured_and_request_is_made_then_filter_is_invoked() {
        let authFilter = new TestAuthFilter("luke", "vaderismydad")

        this.app.middlewareRegistry.addAuthFilter(authFilter)

        await this.sendRequest(
            RequestBuilder.get("/test")
                .basicAuth("luke", "vaderismydad")
                .build()
        )

        Expect(authFilter.wasInvoked).toBeTruthy()
    }

    @AsyncTest()
    public async when_api_auth_filter_configured_and_request_is_made_then_credentials_are_passed_to_filter() {
        let authFilter = new TestAuthFilter("luke", "vaderismydad")

        this.app.middlewareRegistry.addAuthFilter(authFilter)

        await this.sendRequest(
            RequestBuilder.get("/test")
                .basicAuth("luke", "vaderismydad")
                .build()
        )

        Expect(authFilter.passedCredentials.username).toEqual("luke")
        Expect(authFilter.passedCredentials.password).toEqual("vaderismydad")
    }

    @TestCase("vaderismydad", 200)
    @TestCase("whoismydad?", 401)
    @AsyncTest()
    public async when_api_auth_filter_configured_and_credentials_passed_then_valid_endpoint_request_returns_correct_status(password: string, expectedStatus: number) {
        this.app.middlewareRegistry.addAuthFilter(
            new TestAuthFilter("luke", "vaderismydad")
        )

        let response = await this.sendRequest(
            RequestBuilder.get("/test")
                .basicAuth("luke", password)
                .build()
        )

        Expect(response.statusCode).toEqual(expectedStatus)
    }

    @AsyncTest()
    public async when_api_auth_filter_configured_and_no_credentials_passed_then_valid_endpoint_request_returns_401_unauthorized() {
        this.app.middlewareRegistry.addAuthFilter(
            new TestAuthFilter("luke", "vaderismydad")
        )

        let response = await this.sendRequest(
            RequestBuilder.get("/test")
                .build()
        )

        Expect(response.statusCode).toEqual(401)
    }

    @AsyncTest()
    public async when_api_auth_filter_configured_and_filter_throws_error_then_request_returns_500_server_error() {
        this.app.middlewareRegistry.addAuthFilter(
            new TestAuthFilter("luke", "vaderismydad", true)
        )

        let response = await this.sendRequest(
            RequestBuilder.get("/test")
                .basicAuth("luke", "vaderismydad")
                .build()
        )

        Expect(response.statusCode).toEqual(500)
    }

    @AsyncTest()
    public async when_api_auth_filter_configured_and_credentials_passed_then_endpoint_is_passed_current_principal() {
        this.app.middlewareRegistry.addAuthFilter(
            new TestAuthFilter("stoat", "ihavenoideawhatiam")
        )

        let response = await this.sendRequest(
            RequestBuilder.get("/test/user-test")
                .basicAuth("stoat", "ihavenoideawhatiam")
                .build()
        )

        Expect(response.body).toEqual("stoat")
    }
}
