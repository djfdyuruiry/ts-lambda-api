import { injectable } from "inversify"
import { LoggerOptions, Options, SerializerFunction } from "lambda-api"

import { OpenApiConfig } from "./OpenApiConfig"
import { LogLevel } from "./logging/LogLevel"
import { ServerLoggerConfig } from "./logging/ServerLoggerConfig"

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
     * lambda-api logging configuration. Enables/disables default logging
     * by setting to a boolean value or allows for configuration through
     * a Logging Configuration object.
     *
     * Defaults to info level logging.
     */
    public logger?: boolean | LoggerOptions

    /**
     * Logging configuration for ts-lambda-api.
     * See [[ServerLoggerConfig]] for more information.
     *
     * Defaults to info level plain string logging.
     */
    public serverLogger?: ServerLoggerConfig

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
    public openApi?: OpenApiConfig

    public constructor() {
        this.openApi = new OpenApiConfig()
        this.logger = {
            level: "info"
        }
        this.serverLogger = {
            format: "string",
            level: LogLevel.info
        }
    }
}
