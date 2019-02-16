export class ApiRequest {
    httpMethod: string
    path: string
    headers: object = {}
    queryStringParameters: object = {}
    body: string
    isBase64Encoded: boolean
}
