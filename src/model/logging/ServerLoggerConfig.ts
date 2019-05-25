import { LogLevel } from "./LogLevel"
import { LogFormat } from "../../util/logging/ILogger"

/**
 * Logging configuration for the `ts-lambda-api` framework.
 */
export class ServerLoggerConfig {
    /**
     * Lowest level of log message to output.
     *
     * See [[LogLevel]] for levels supported.
     */
    public level: LogLevel

    /**
     * Print an ISO 8601 timestamp before every log message? (string format only)
     *
     * Defaults to false, AWS Lambda already includes timestamps
     * in it's log of standard output.
     */
    public logTimestamp?: boolean

    /**
     * Format of log messages. A plain string:
     *
     * ```
     * level  class                   message
     * vvvvv vvvvvvvv   vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
     * INFO  Endpoint - Invoking endpoint: [GET] /open-api.yml
     * ```
     *
     * A plain string with `logTimestamp` set to true:
     *
     * ```
     *     ISO 8601 Datetime    level class                   message
     * vvvvvvvvvvvvvvvvvvvvvvvv vvvvv vvvvvvvv   vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
     * 2019-04-21T16:38:09.680Z INFO  Endpoint - Invoking endpoint: [GET] /open-api.yml
     * ```
     *
     * A JSON format message (matches lambda-api format):
     *
     * ```json
     * {
     *   "level": "INFO",
     *   "msg": "Endpoint - Invoking endpoint: [GET] /open-api.yml",
     *   "time": 1555865906882 // millis since epoch
     * }
     * ```
     */
    public format?: LogFormat
}
