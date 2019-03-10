import { injectable } from "inversify"
import { LoggerOptions, Options, SerializerFunction } from "lambda-api"

import { OpenApiConfig } from "./OpenApiConfig"

/**
 * Base class for app configuration. Extend this
 * to supply your own configuration properties.
 *
 * It is recommended to create your own sub-class and
 * register it with the application IOC container.
 *
 * This class supports all the `lambda-api` config
 * options by implementing the `Options` interface.
 */
@injectable()
export class AppConfig implements Options {
    /**
     * API human readable name.
     */
    public name?: string

    /**
     * Version number accessible via `Request` context instances.
     */
    public version?: string

    /**
     * Base path for all routes, e.g. base: 'v1' would
     * prefix all routes with /v1.
     */
    public base?: string

    /**
     * Override the default callback query parameter name
     * for JSONP calls.
     */
    public callbackName?: string

    /**
     * Enables default logging or allows for configuration
     * through a Logging Configuration object.
     */
    public logger?: boolean | LoggerOptions

    /**
     * Name/value pairs of additional MIME types to be supported
     * by the type(). The key should be the file extension
     * (without the .) and the value should be the expected MIME type,
     * e.g. `application/json`.
     */
    public mimeTypes?: {
        [key: string]: string
    }

    /**
     * Optional object serializer function. This function receives the
     * body of a response and must return a string. Defaults to JSON.stringify
     */
    public serializer?: SerializerFunction

    /**
     * OpenAPI configuration.
     */
    public openApi?: OpenApiConfig = new OpenApiConfig()
}
