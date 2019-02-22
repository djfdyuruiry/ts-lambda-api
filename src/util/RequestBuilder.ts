import { METHODS } from "lambda-api"

import { ApiRequest } from "../model/ApiRequest"

export class RequestBuilder {
    private readonly method: METHODS
    private readonly path: string
    private readonly httpHeaders: { [key: string] : string}
    private readonly httpQueryParams: { [key: string] : string}
    private httpBody: string

    private constructor(method: METHODS, path: string) {
        this.method = method
        this.path = path

        this.httpHeaders = {}
        this.httpQueryParams = {}
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

    public static do(method: METHODS, path: string) {
        return new RequestBuilder(method, path)
    }

    public header(key: string, value: string) {
        this.httpHeaders[key] = value
        return this
    }

    public headers(httpHeaders: { [key: string] : string}) {
        for (let key in httpHeaders) {
            this.httpHeaders[key] = httpHeaders[key]
        }

        return this
    }

    public query(key: string, value: string) {
        this.httpQueryParams[key] = value
        return this
    }

    public queryParams(params: { [key: string] : string}) {
        for (let key in params) {
            this.httpQueryParams[key] = params[key]
        }

        return this
    }

    public body(value: string) {
        this.httpBody = value
        return this
    }

    public basicAuth(username: string, password: string) {
        let credentials = Buffer.from(`${username}:${password}`).toString("base64")

        this.httpHeaders["Authorization"] = `Basic ${credentials}`
        return this
    }

    private mapToObject(map: { [key: string] : string}) {
        let obj = {}

        for (let key in map) {
            obj[key] = map[key]
        }

        return obj
    }

    public build() {
        let request = new ApiRequest()

        request.path = this.path
        request.httpMethod = this.method
        request.headers = this.mapToObject(this.httpHeaders)
        request.queryStringParameters = this.mapToObject(this.httpQueryParams)
        request.body = this.httpBody
        request.isBase64Encoded = false

        return request
    }
}
