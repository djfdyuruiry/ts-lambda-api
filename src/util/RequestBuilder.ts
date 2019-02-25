import { METHODS } from "lambda-api"

import { ApiRequest } from "../model/ApiRequest"

export interface IDictionary<T> { [key: string]: T}

/**
 * Builds `ApiRequest` instances using the builder
 * pattern. Used for testing.
 */
export class RequestBuilder {
    private readonly method: METHODS
    private readonly path: string
    private readonly httpHeaders: IDictionary<String>
    private readonly httpQueryParams: IDictionary<String>
    private httpBody: string

    /**
     * Start building a HTTP GET request.
     *
     * @param path URL path to request.
     */
    public static get(path: string) {
        return new RequestBuilder("GET", path)
    }

    /**
     * Start building a HTTP POST request.
     *
     * @param path URL path to request.
     */
    public static post(path: string) {
        return new RequestBuilder("POST", path)
    }

    /**
     * Start building a HTTP PUT request.
     *
     * @param path URL path to request.
     */
    public static put(path: string) {
        return new RequestBuilder("PUT", path)
    }

    /**
     * Start building a HTTP PATCH request.
     *
     * @param path URL path to request.
     */
    public static patch(path: string) {
        return new RequestBuilder("PATCH", path)
    }

    /**
     * Start building a HTTP DELETE request.
     *
     * @param path URL path to request.
     */
    public static delete(path: string) {
        return new RequestBuilder("DELETE", path)
    }

    /**
     * Start building a HTTP request.
     *
     * @param method HTTP method to use.
     * @param path URL path to request.
     */
    public static do(method: METHODS, path: string) {
        return new RequestBuilder(method, path)
    }

    private constructor(method: METHODS, path: string) {
        this.method = method
        this.path = path

        this.httpHeaders = {}
        this.httpQueryParams = {}
    }

    /**
     * Add a HTTP header to the request.
     *
     * @param name Name of the header.
     * @param value Value to set.
     * @returns This builder instance.
     */
    public header(name: string, value: string) {
        this.httpHeaders[name] = value
        return this
    }

    /**
     * Add multiple HTTP headers to the request.
     *
     * @param httpHeaders Map of HTTP headers to add.
     * @returns This builder instance.
     */
    public headers(httpHeaders: IDictionary<String>) {
        for (let key in httpHeaders) {
            if (!httpHeaders.hasOwnProperty(key)) {
                continue
            }

            this.httpHeaders[key] = httpHeaders[key]
        }

        return this
    }

    /**
     * Add a HTTP query parameter to the request.
     *
     * @param name Name of the query param.
     * @param value Value to set.
     * @returns This builder instance.
     */
    public query(key: string, value: string) {
        this.httpQueryParams[key] = value
        return this
    }

    /**
     * Add multiple HTTP query parameters to the request.
     *
     * @param params Map of HTTP query params to add.
     * @returns This builder instance.
     */
    public queryParams(params: IDictionary<String>) {
        for (let key in params) {
            if (!params.hasOwnProperty(key)) {
                continue
            }

            this.httpQueryParams[key] = params[key]
        }

        return this
    }

    /**
     * Add a HTTP body to the request.
     *
     * @param value The body as a raw string.
     * @returns This builder instance.
     */
    public body(value: string) {
        this.httpBody = value
        return this
    }

    /**
     * Add basic authentication to the request.
     *
     * @param username Username to send.
     * @param password Password to send.
     * @returns This builder instance.
     */
    public basicAuth(username: string, password: string) {
        let credentials = Buffer.from(`${username}:${password}`).toString("base64")

        this.httpHeaders.Authorization = `Basic ${credentials}`
        return this
    }

    private mapToObject(map: IDictionary<String>) {
        let obj = {}

        for (let key in map) {
            if (!map.hasOwnProperty(key)) {
                continue
            }

            obj[key] = map[key]
        }

        return obj
    }

    /**
     * Build a request object using the current builder config.
     */
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
