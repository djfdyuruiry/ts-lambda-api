import { Expect, Test, TestCase, TestFixture } from "alsatian"

import { RequestBuilder } from "../../dist/ts-lambda-api"

import { TestBase } from "./TestBase"
import { TestAuthFilter } from "./test-components/TestAuthFilter"
import { TestAuthorizer } from "./test-components/TestAuthorizer"

@TestFixture()
export class AuthorizerTests extends TestBase {
    @Test()
    @TestCase(null)
    @TestCase(undefined)
    @Test()
    public async when_invalid_api_authorizer_is_passed_to_app_then_throws_an_error(invalidAuthorizer: TestAuthorizer) {
        Expect(() => this.app.middlewareRegistry.addAuthorizer(invalidAuthorizer))
            .toThrow()
    }

    @Test()
    public async when_api_authorizer_configured_and_no_roles_declared_then_unprotected_resource_returns_200_ok() {
        this.app.middlewareRegistry.addAuthorizer(new TestAuthorizer())

        let response = await this.sendRequest(
            RequestBuilder.get("/test")
                .build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    @TestCase("/test/restricted")
    @TestCase("/test-restricted")
    @Test()
    public async when_api_authorizer_not_configured_and_roles_declared_then_protected_resource_returns_500_server_error(path: string) {
        let response = await this.sendRequest(
            RequestBuilder.get(path)
                .build()
        )

        Expect(response.statusCode).toEqual(500)
    }

    @TestCase({ path: "/test/restricted", userRoles: ["SPECIAL_USER"] })
    @TestCase({ path: "/test-restricted", userRoles: ["SPECIAL_USER"] })
    @TestCase({ path: "/test-restricted", userRoles: ["SUPER_SPECIAL_USER"] })
    @Test()
    public async when_api_authorizer_configured_with_roles_declared_and_user_is_authorized_then_valid_request_returns_200_ok(testCase: any) {
        this.app.middlewareRegistry.addAuthFilter(
            new TestAuthFilter("stoat", "ihavenoideawhatiam", false, testCase.userRoles)
        )
        this.app.middlewareRegistry.addAuthorizer(new TestAuthorizer())

        let response = await this.sendRequest(
            RequestBuilder.get(testCase.path)
                .basicAuth("stoat", "ihavenoideawhatiam")
                .build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    @TestCase({ path: "/test/restricted", userRoles: ["SPECIAL_USER"] })
    @TestCase({ path: "/test-restricted", userRoles: ["SPECIAL_USER"] })
    @TestCase({ path: "/test-restricted", userRoles: ["SUPER_SPECIAL_USER"] })
    @Test()
    public async when_api_authorizer_configured_with_roles_declared_and_user_is_authorized_and_authorizer_throws_error_then_valid_request_returns_500_server_error(testCase: any) {
        this.app.middlewareRegistry.addAuthFilter(
            new TestAuthFilter("stoat", "ihavenoideawhatiam", false, testCase.userRoles)
        )
        this.app.middlewareRegistry.addAuthorizer(new TestAuthorizer(true))

        let response = await this.sendRequest(
            RequestBuilder.get(testCase.path)
                .basicAuth("stoat", "ihavenoideawhatiam")
                .build()
        )

        Expect(response.statusCode).toEqual(500)
    }

    @TestCase("/test/restricted")
    @TestCase("/test-restricted")
    @Test()
    public async when_api_authorizer_configured_with_roles_declared_and_user_is_not_authorized_then_valid_request_returns_403_forbidden(path: string) {
        this.app.middlewareRegistry.addAuthFilter(
            new TestAuthFilter("stoat", "ihavenoideawhatiam", false, ["ANOTHER_THING"])
        )
        this.app.middlewareRegistry.addAuthorizer(new TestAuthorizer())

        let response = await this.sendRequest(
            RequestBuilder.get(path)
                .basicAuth("stoat", "ihavenoideawhatiam")
                .build()
        )

        Expect(response.statusCode).toEqual(403)
    }

    @TestCase("/test/restricted")
    @TestCase("/test-restricted")
    @Test()
    public async when_api_authorizer_configured_and_role_declared_then_principle_and_role_are_passed_to_authorizer(path: string) {
        let authorizer = new TestAuthorizer()

        this.app.middlewareRegistry.addAuthFilter(
            new TestAuthFilter("stoat", "ihavenoideawhatiam")
        )
        this.app.middlewareRegistry.addAuthorizer(authorizer)

        await this.sendRequest(
            RequestBuilder.get(path)
                .basicAuth("stoat", "ihavenoideawhatiam")
                .build()
        )

        Expect(authorizer.principalPassed.name).toEqual("stoat")
        Expect(authorizer.rolePassed).toEqual("SPECIAL_USER")
    }

    @TestCase("/test-no-auth")
    @TestCase("/test/no-auth")
    @Test()
    public async when_api_authorizer_configured_then_valid_no_auth_endpoint_request_does_not_invoke_authorizer_and_responds_with_200_ok(path: string) {
        let authorizer = new TestAuthorizer()

        this.app.middlewareRegistry.addAuthFilter(
            new TestAuthFilter("stoat", "ihavenoideawhatiam")
        )
        this.app.middlewareRegistry.addAuthorizer(authorizer)

        let response = await this.sendRequest(
            RequestBuilder.get(path).build()
        )

        Expect(authorizer.wasInvoked).toBe(false)
        Expect(response.statusCode).toEqual(200)
    }
}
