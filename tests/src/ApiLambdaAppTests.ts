import path from "path"

import { Expect, Test, TestFixture } from "alsatian"
import { Container } from "inversify"
import type { ALBEvent, APIGatewayProxyEvent, APIGatewayProxyEventV2 } from "aws-lambda"

import { ApiLambdaApp, RequestBuilder } from "../../dist/ts-lambda-api"

import { TestBase } from "./TestBase"

@TestFixture()
export class ApiLambdaAppTests extends TestBase {
    private createApiGatewayV2Event(rawPath: string): APIGatewayProxyEventV2 {
        return {
            version: "2.0",
            routeKey: "$default",
            rawPath,
            rawQueryString: "",
            headers: {},
            requestContext: {
                accountId: "123456789012",
                apiId: "api-id",
                domainName: "example.com",
                domainPrefix: "example",
                http: {
                    method: "GET",
                    path: rawPath,
                    protocol: "HTTP/1.1",
                    sourceIp: "127.0.0.1",
                    userAgent: "alsatian"
                },
                requestId: "request-id",
                routeKey: "$default",
                stage: "$default",
                time: "16/Mar/2026:00:00:00 +0000",
                timeEpoch: 0
            },
            isBase64Encoded: false
        }
    }

    private createApiGatewayV1Event(path: string): APIGatewayProxyEvent {
        return {
            body: null,
            headers: {},
            httpMethod: "GET",
            isBase64Encoded: false,
            multiValueHeaders: {},
            multiValueQueryStringParameters: null,
            path,
            pathParameters: null,
            queryStringParameters: null,
            requestContext: {
                accountId: "123456789012",
                apiId: "api-id",
                authorizer: {},
                httpMethod: "GET",
                identity: {
                    accessKey: null,
                    accountId: null,
                    apiKey: null,
                    apiKeyId: null,
                    caller: null,
                    clientCert: null,
                    cognitoAuthenticationProvider: null,
                    cognitoAuthenticationType: null,
                    cognitoIdentityId: null,
                    cognitoIdentityPoolId: null,
                    principalOrgId: null,
                    sourceIp: "127.0.0.1",
                    user: null,
                    userAgent: "alsatian",
                    userArn: null
                },
                path,
                protocol: "HTTP/1.1",
                requestId: "request-id",
                requestTime: "16/Mar/2026:00:00:00 +0000",
                requestTimeEpoch: 0,
                resourceId: "resource-id",
                resourcePath: "/{proxy+}",
                stage: "prod"
            },
            resource: "/{proxy+}",
            stageVariables: null
        }
    }

    private createAlbEvent(path: string): ALBEvent {
        return {
            body: null,
            headers: {},
            httpMethod: "GET",
            isBase64Encoded: false,
            multiValueHeaders: {},
            multiValueQueryStringParameters: null,
            path,
            queryStringParameters: null,
            requestContext: {
                elb: {
                    targetGroupArn: "arn:aws:elasticloadbalancing:ap-southeast-2:123456789012:targetgroup/test/123"
                }
            }
        }
    }

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
        let container = new Container({ autobind: true })

        let app = new ApiLambdaApp(
            TestBase.CONTROLLERS_PATH,
            this.appConfig,
            true,
            container
        )

        app.configureApp(c => Expect(c).toBe(container))
    }

    @Test()
    public async when_default_app_container_then_contoller_path_must_be_valid() {
         Expect(() => new ApiLambdaApp(
           ["  "],
            this.appConfig
        )).toThrow()
    }

    @Test()
    public async when_default_app_container_then_contoller_path_is_required() {
        Expect(() => new ApiLambdaApp(
            undefined,
            this.appConfig
        )).toThrow()
    }

    @Test()
    public async when_custom_container_passed_to_app_with_auto_bind_injectable_enabled_then_contoller_path_must_be_valid() {
        let container = new Container({ autobind: true })

        Expect(() => new ApiLambdaApp(
            ["  "],
            this.appConfig,
            true,
            container
        )).toThrow()
    }

    @Test()
    public async when_custom_container_passed_to_app_with_auto_bind_injectable_enabled_then_contoller_path_is_required() {
        let container = new Container({ autobind: true })

        Expect(() => new ApiLambdaApp(
           undefined,
            this.appConfig,
            true,
            container
        )).toThrow()
    }

    @Test()
    public async when_custom_container_passed_to_app_with_auto_bind_injectable_disabled_then_contoller_path_can_be_undefined() {
        let container = new Container()

        let app = new ApiLambdaApp(
            undefined,
            this.appConfig,
            false,
            container
        )

        app.configureApp(c => Expect(c).toBe(container))
    }

    @Test()
    public async when_custom_container_passed_to_app_with_auto_bind_injectable_disabled_then_contoller_path_ignored() {
        let container = new Container()

        let app = new ApiLambdaApp(
            [" "],
            this.appConfig,
            false,
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

    @Test()
    public async when_raw_api_gateway_v2_event_passed_to_run_then_event_is_processed() {
        let response = await this.app.run(this.createApiGatewayV2Event("/test"), {})

        Expect(response.statusCode).toEqual(200)
        Expect(response.body).toEqual("OK")
    }

    @Test()
    public async when_raw_api_gateway_v1_event_passed_to_run_then_event_is_processed() {
        let response = await this.app.run(this.createApiGatewayV1Event("/test"), {})

        Expect(response.statusCode).toEqual(200)
        Expect(response.body).toEqual("OK")
    }

    @Test()
    public async when_raw_alb_event_passed_to_run_then_event_is_processed() {
        let response = await this.app.run(this.createAlbEvent("/test"), {})

        Expect(response.statusCode).toEqual(200)
        Expect(response.body).toEqual("OK")
    }

    @Test()
    public async when_handler_created_then_raw_event_is_processed() {
        let handler = this.app.createHandler()

        let response = await handler(this.createApiGatewayV2Event("/test"), {} as any, (() => {}) as any)

        Expect(response.statusCode).toEqual(200)
        Expect(response.body).toEqual("OK")
    }

    @Test()
    public async when_only_top_level_controllers_path_passed_then_nested_controllers_are_loaded() {
        let app = new ApiLambdaApp(
            [path.join(__dirname, "test-controllers")],
            this.appConfig
        )

        let response = await app.run(this.createApiGatewayV2Event("/nested"), {})

        Expect(response.statusCode).toEqual(200)
        Expect(response.body).toEqual("nested-ok")
    }

    @Test()
    public async when_overlapping_controller_roots_passed_then_nested_controllers_still_resolve() {
        let rootPath = path.join(__dirname, "test-controllers")
        let nestedPath = path.join(rootPath, "nested")
        let app = new ApiLambdaApp([rootPath, nestedPath], this.appConfig)

        let response = await app.run(this.createApiGatewayV2Event("/nested"), {})

        Expect(response.statusCode).toEqual(200)
        Expect(response.body).toEqual("nested-ok")
    }
}
