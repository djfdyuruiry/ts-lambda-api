import { METHODS } from "lambda-api"

import { ApiRequest } from "../model/ApiRequest"

export class RequestBuilder {
    private readonly method: METHODS
    private readonly path: string
    private readonly httpHeaders: Map<string, string>
    private readonly httpQueryParams: Map<string, string>
    private readonly body: string

    private constructor(method: METHODS, path: string) {
        this.method = method
        this.path = path

        this.httpHeaders = new Map<string, string>()
        this.httpQueryParams = new Map<string, string>()
    }

    public static get(path: string) {
        return new RequestBuilder("GET", path)
    }

    public static post(path: string) {
        return new RequestBuilder("POST", path)
    }

    public static put(path: string) {
        return new RequestBuilder("PUT", path)
    }

    public static patch(path: string) {
        return new RequestBuilder("PATCH", path)
    }

    public static delete(path: string) {
        return new RequestBuilder("DELETE", path)
    }

    public header(key: string, value: string) {
        this.headers[key] = value
    }

    public headers(httpHeaders: Map<string, string>) {
        httpHeaders.forEach((k,v) => this.httpHeaders[k] = v)
    }

    public query(key: string, value: string) {
        this.queryParams[key] = value
    }

    public queryParams(params: Map<string, string>) {
        params.forEach((k,v) => this.httpQueryParams[k] = v)
    }

    private mapToObject(map: Map<string, string>) {
        let obj = {}

        map.forEach((k,v) => obj[k] = v)

        return obj
    }

    public build() {
        let request = new ApiRequest()

        request.path = this.path
        request.httpMethod = this.method
        request.headers = this.mapToObject(this.httpHeaders)
        request.queryStringParameters = this.mapToObject(this.httpQueryParams)
        request.body = this.body
        request.isBase64Encoded = false

        return request
    }
}
