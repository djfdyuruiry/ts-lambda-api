import { LogLevel } from "./LogLevel"
import { LogFormat } from "../../util/logging/ILogger"

export class ServerLoggerConfig {
    /**
     * Lowest level of log message to output.
     *
     * @see{LogLevel} for levels supported.
     */
    public level: LogLevel

    /**
     * Format of log messages. Either a plain string:
     *
     * ```
     *       ISO8086 Datetime     level class                   message
     *   vvvvvvvvvvvvvvvvvvvvvvvv vvvv vvvvvvvv   vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
     *   2019-04-21T16:38:09.680Z INFO Endpoint - Invoking endpoint: [GET] /open-api.yml
     * ```
     *
     * Or a JSON format message (matches lambda-api format):
     *
     * ```json
     * {
     *   level: "INFO",
     *   msg: "Endpoint - Invoking endpoint: [GET] /open-api.yml",
     *   time: 1555865906882 // millis since epoch
     * }
     * ```
     */
    public format?: LogFormat
}
