import { Expect, AsyncTest, TestFixture, TestCase } from "alsatian"
import { Container } from "inversify"

import { ApiLambdaApp, AppConfig, RequestBuilder } from "../../index"

import { TestBase } from "./TestBase"
import { TestDecoratorErrorInterceptor } from "./TestDecoratorErrorInterceptor"
import { TestErrorInterceptor } from './TestErrorInterceptor'

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

    public async when_api_decorator_error_interceptor_is_present_and_it_throws_an_error_then_interceptor_is_invoked() {
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
}
