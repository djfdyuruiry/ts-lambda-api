import { AsyncTest, Expect, TestCase, TestFixture } from "alsatian"

import { ErrorInterceptor, RequestBuilder } from "../../dist/ts-lambda-api"

import { TestBase } from "./TestBase"
import { TestDecoratorErrorInterceptor } from "./test-components/TestDecoratorErrorInterceptor"
import { TestErrorInterceptor } from "./test-components/TestErrorInterceptor"

@TestFixture()
export class ErrorInterceptorTests extends TestBase {
    @TestCase(null)
    @TestCase(undefined)
    @AsyncTest()
    public async when_invalid_api_error_interceptor_is_passed_to_app_then_throws_an_error(invalidErrorInterceptor: ErrorInterceptor) {
        Expect(() => this.app.middlewareRegistry.addErrorInterceptor(invalidErrorInterceptor))
            .toThrow()
    }

    @TestCase({ controller: "TestController" })
    @TestCase({ endpoint: "TestController::raiseError" })
    @AsyncTest()
    public async when_api_error_interceptor_is_configured_and_it_throws_an_error_then_interceptor_is_invoked(testCase: any) {
        let errorInterceptor = new TestErrorInterceptor(testCase.endpoint, testCase.controller)

        this.app.middlewareRegistry.addErrorInterceptor(errorInterceptor)

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

        this.app.middlewareRegistry.addErrorInterceptor(errorInterceptor)

        await this.sendRequest(
            RequestBuilder.get("/test").build()
        )

        Expect(errorInterceptor.wasInvoked).toBe(false)
    }

    @AsyncTest()
    public async when_api_error_interceptor_is_invoked_and_no_response_is_returned_by_interceptor_then_original_error_is_returned() {
        this.app.middlewareRegistry.addErrorInterceptor(
            new TestErrorInterceptor("TestController::raiseError")
        )

        let response = await this.sendRequest(
            RequestBuilder.get("/test/raise-error").build()
        )

        Expect(response.statusCode).toEqual(500)
        Expect(response.body).toEqual("{\"error\":\"all I do is throw an error\"}")
    }

    @AsyncTest()
    public async when_api_error_interceptor_is_invoked_and_response_is_returned_by_interceptor_then_interceptor_response_is_returned() {
        this.app.middlewareRegistry.addErrorInterceptor(
            new TestErrorInterceptor("TestController::raiseError", null, true)
        )

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

        this.app.middlewareRegistry.addErrorInterceptor(errorInterceptor)

        await this.sendRequest(
            RequestBuilder.get(path).build()
        )

        Expect(errorInterceptor.wasInvoked).toBeTruthy()
    }
}
