export class OpenApiConfig {
    /**
     * Set this flag to true to enable OpenAPI endpoints in
     * your API @ {basePath}/open-api.json and {basePath}/open-api.yml
     */
    public enabled?: boolean

    /**
     * Set this flag to apply any registered authentication
     * filters to OpenAPI spec requests.
     */
    public useAuthentication?: boolean
}
