import { Expect, Test, TestFixture } from "alsatian"
import { Container } from "inversify"

import { ApiLambdaApp, RequestBuilder } from "../../dist/ts-lambda-api"

import { TestBase } from "./TestBase"

@TestFixture()
export class ApiLambdaAppTests extends TestBase {
    @Test()
    public async when_custom_config_passed_to_app_then_it_is_respected() {
        this.appConfig.base = "api/v1/"

        this.app = new ApiLambdaApp(TestBase.CONTROLLERS_PATH, this.appConfig)

        let response = await this.sendRequest(
            RequestBuilder.get("/test").build()
        )

        Expect(response.statusCode).toEqual(404)

        response = await this.sendRequest(
            RequestBuilder.get("/api/v1/test").build()
        )

        Expect(response.statusCode).toEqual(200)
    }

    @Test()
    public async when_custom_container_passed_to_app_then_it_is_available_for_configuration() {
        let container = new Container({ autoBindInjectable: true })

        let app = new ApiLambdaApp(
            TestBase.CONTROLLERS_PATH,
            this.appConfig,
            container
        )

        app.configureApp(c => Expect(c).toBe(container))
    }

    @Test()
    public async when_api_is_configured_using_app_then_configuration_is_respected() {
        this.app.configureApi(a => a.get("/manual-endpoint", (_, res) => {
            res.send("OK")
        }))

        let response = await this.sendRequest(
            RequestBuilder.get("/manual-endpoint").build()
        )

        Expect(response.statusCode).toEqual(200)
    }
}
