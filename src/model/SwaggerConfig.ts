export class SwaggerConfig {
    /**
     * Set this flag to true to enable swagger endpoints in
     * your API @ {basePath}/swagger.json and {basePath}/swagger.yml
     */
    public enabled?: boolean

    /**
     * Set this flag to apply any registered authentication
     * filters to swagger spec requests.
     */
    public useAuthentication?: boolean
}
