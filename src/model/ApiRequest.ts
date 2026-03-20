import type {
    ALBEvent,
    APIGatewayProxyEvent,
    APIGatewayProxyEventV2,
    Handler
} from "aws-lambda"

/**
 * AWS Lambda HTTP request event. Used for testing,
 * enabling manually passing requests to a `ApiLambdaApp`
 * instance.
 */
export class ApiRequest {
    /**
     * HTTP method ('GET', 'POST', 'PUT' etc.)
     */
    public httpMethod: string

    /**
     * Request URL path. Excludes protocol, host and port.
     */
    public path: string

    /**
     * HTTP request headers as a map.
     */
    public headers: object = {}

    /**
     * HTTP request query string parameters as a map.
     */
    public queryStringParameters: object = {}

    /**
     * HTTP request event body, potentially Base64 encoded.
     */
    public body: string

    /**
     * Is the `body` property Base64 encoded?
     */
    public isBase64Encoded: boolean
}

/**
 * Native AWS Lambda HTTP event shapes supported by `lambda-api`.
 */
export type NativeApiRequest = APIGatewayProxyEventV2 | APIGatewayProxyEvent | ALBEvent

/**
 * Request shape accepted by `ApiLambdaApp`.
 */
export type LambdaApiRequest = ApiRequest | NativeApiRequest

/**
 * Lambda handler returned by `ApiLambdaApp.createHandler()`.
 */
export type LambdaApiHandler = Handler<LambdaApiRequest, any>
