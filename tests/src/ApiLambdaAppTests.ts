import { AsyncTest, Expect, TestFixture } from "alsatian"
import { Container } from "inversify"

import { AppConfig, ApiLambdaApp, RequestBuilder } from "../../dist/typescript-lambda-api"

import { TestBase } from "./TestBase"

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
}
