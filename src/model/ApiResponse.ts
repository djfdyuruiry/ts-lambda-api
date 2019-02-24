/**
 * Response to aAWS Lambda HTTP request event. Used for testing.
 */
export class ApiResponse {
    /**
     * HTTP response headers as a map.
     */
    headers: object


    /**
     * HTTP response code (201, 400, 500 etc.)
     */
    statusCode: number

    /**
     * HTTP response body, potentially Base64 encoded.
     */
    body: string

    /**
     * Is the `body` property Base64 encoded?
     */
    isBase64Encoded: boolean
}
