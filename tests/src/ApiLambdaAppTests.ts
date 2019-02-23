import { Expect, AsyncTest, TestFixture, TestCase } from "alsatian"
import { Container } from "inversify"

import { ApiLambdaApp, AppConfig, RequestBuilder } from "../../index"

import { TestBase } from "./TestBase"
import { TestDecoratorErrorInterceptor } from "./TestDecoratorErrorInterceptor"
import { TestErrorInterceptor } from "./TestErrorInterceptor"
import { TestAuthFilter } from "./TestAuthFilter"

@TestFixture()
export class ApiLambdaAppTests extends TestBase {
    @AsyncTest()
    public async when_custom_config_passed_to_app_then_it_is_respected() {
        let config: AppConfig = {
            base: "api/v1/"
        }

        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, config)

        let response = await this.sendRequest(
            RequestBuilder.get("/test").build()
        )

        Expect(response.statusCode).toEqual(404)

        response = await this.sendRequest(
            RequestBuilder.get("/api/v1/test").build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    @AsyncTest()
    public async when_custom_container_passed_to_app_then_it_is_available_for_configuration() {
        let container = new Container({ autoBindInjectable: true })

        let app = new ApiLambdaApp(
            TestBase.CONTROLLERS_PATH,
            undefined,
            container
        )

        app.configureApp(c => Expect(c).toBe(container))
    }

    @AsyncTest()
    public async when_api_is_configured_using_app_then_configuration_is_respected() {
        this.app.configureApi(a => a.get("/manual-endpoint", (_, res) => {
            res.send("OK")
        }))

        let response = await this.sendRequest(
            RequestBuilder.get("/manual-endpoint").build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    @TestCase({ controller: "TestController" })
    @TestCase({ endpoint: "TestController::raiseError" })
    @AsyncTest()
    public async when_api_error_interceptor_is_configured_and_it_throws_an_error_then_interceptor_is_invoked(testCase: any) {
        let errorInterceptor = new TestErrorInterceptor(testCase.endpoint, testCase.controller)

        this.app.addErrorInterceptor(errorInterceptor)

        await this.sendRequest(
            RequestBuilder.get("/test/raise-error").build()
        )

        Expect(errorInterceptor.wasInvoked).toBeTruthy()
    }

    @AsyncTest()
    public async when_api_controller_decorator_error_interceptor_is_present_and_it_throws_an_error_then_interceptor_is_invoked() {
        TestDecoratorErrorInterceptor.wasInvoked = false

        await this.sendRequest(
            RequestBuilder.get("/test/controller-ei-decorator").build()
        )

        Expect(TestDecoratorErrorInterceptor.wasInvoked).toBeTruthy()
    }

    @AsyncTest()
    public async when_api_endpoint_decorator_error_interceptor_is_present_and_it_throws_an_error_then_interceptor_is_invoked() {
        TestDecoratorErrorInterceptor.wasInvoked = false

        await this.sendRequest(
            RequestBuilder.get("/test/ei-decorator").build()
        )

        Expect(TestDecoratorErrorInterceptor.wasInvoked).toBeTruthy()
    }

    @AsyncTest()
    public async when_api_error_interceptor_is_configured_and_no_error_is_thrown_then_interceptor_is_not_invoked() {
        let errorInterceptor = new TestErrorInterceptor(null, "TestController")

        this.app.addErrorInterceptor(errorInterceptor)

        await this.sendRequest(
            RequestBuilder.get("/test").build()
        )

        Expect(errorInterceptor.wasInvoked).toBe(false)
    }

    @AsyncTest()
    public async when_api_error_interceptor_is_invoked_and_no_response_is_returned_by_interceptor_then_original_error_is_returned() {
        this.app.addErrorInterceptor(new TestErrorInterceptor("TestController::raiseError"))

        let response = await this.sendRequest(
            RequestBuilder.get("/test/raise-error").build()
        )

        Expect(response.statusCode).toEqual(500)
        Expect(response.body).toEqual("{\"error\":\"all I do is throw an error\"}")
    }

    @AsyncTest()
    public async when_api_error_interceptor_is_invoked_and_response_is_returned_by_interceptor_then_interceptor_response_is_returned() {
        this.app.addErrorInterceptor(new TestErrorInterceptor("TestController::raiseError", null, true))

        let response = await this.sendRequest(
            RequestBuilder.get("/test/raise-error").build()
        )

        Expect(response.statusCode).toEqual(200)
        Expect(response.body).toEqual("interceptor return value")
    }

    @TestCase("/test/raise-error")
    @TestCase("/test/methods/raise-error")
    @AsyncTest()
    public async when_global_api_error_interceptor_is_invoked_and_error_is_thrown_in_any_endpoint_then_interceptor_is_invoked(path: string) {
        let errorInterceptor = new TestErrorInterceptor("*", null)

        this.app.addErrorInterceptor(errorInterceptor)

        await this.sendRequest(
            RequestBuilder.get(path).build()
        )

        Expect(errorInterceptor.wasInvoked).toBeTruthy()
    }

    @AsyncTest()
    public async when_api_auth_filter_configured_and_request_is_made_then_filter_is_invoked() {
        let authFilter = new TestAuthFilter("luke", "vaderismydad")

        this.app.addAuthFilter(authFilter)

        await this.sendRequest(
            RequestBuilder.get("/test")
                .basicAuth("luke", "vaderismydad")
                .build()
        )

        Expect(authFilter.wasInvoked).toBeTruthy()
    }

    @TestCase("vaderismydad", 200)
    @TestCase("whoismydad?", 401)
    @AsyncTest()
    public async when_api_auth_filter_configured_and_credentials_passed_then_valid_endpoint_request_returns_correct_status(password: string, expectedStatus: number) {
        this.app.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.sendRequest(
            RequestBuilder.get("/test")
                .basicAuth("luke", password)
                .build()
        )

        Expect(response.statusCode).toEqual(expectedStatus)
    }

    @AsyncTest()
    public async when_api_auth_filter_configured_and_no_credentials_passed_then_valid_endpoint_request_returns_401_unauthorized() {
        this.app.addAuthFilter(new TestAuthFilter("luke", "vaderismydad"))

        let response = await this.sendRequest(
            RequestBuilder.get("/test")
                .build()
        )

        Expect(response.statusCode).toEqual(401)
    }

    @AsyncTest()
    public async when_api_auth_filter_configured_and_filter_throws_error_then_request_returns_401_unauthorized() {
        this.app.addAuthFilter(new TestAuthFilter("luke", "vaderismydad", true))

        let response = await this.sendRequest(
            RequestBuilder.get("/test")
                .basicAuth("luke", "vaderismydad")
                .build()
        )

        Expect(response.statusCode).toEqual(401)
    }

    @AsyncTest()
    public async when_api_auth_filter_configured_and_credentials_passed_then_endpoint_is_passed_current_principal() {
        this.app.addAuthFilter(new TestAuthFilter("stoat", "ihavenoideawhatiam"))

        let response = await this.sendRequest(
            RequestBuilder.get("/test/user-test")
                .basicAuth("stoat", "ihavenoideawhatiam")
                .build()
        )

        Expect(response.body).toEqual("stoat")
    }
}
