import { LogLevel } from "../../model/logging/LogLevel"

export type LogFormat = "string" | "json"

/**
 * Describes a generic logging implementation.
 */
export interface ILogger {
    /**
     * @see{ServerLoggerConfig}
     */
    readonly level: LogLevel

    /**
     * @see{ServerLoggerConfig}
     */
    readonly format: LogFormat

    /**
     * Log a message with a custom level.
     *
     * @param level Level of the log message.
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    log(level: LogLevel, message: string, ...formatArgs: any[])

    /**
     * Log a trace level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    trace(message: string, ...formatArgs: any[])

    /**
     * Log a debug level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    debug(message: string, ...formatArgs: any[])

    /**
     * Log a info level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    info(message: string, ...formatArgs: any[])

    /**
     * Log a warn trace level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    warn(message: string, ...formatArgs: any[])

    /**
     * Log a error level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    error(message: string, ...formatArgs: any[])

    /**
     * Log a error level message with an associated error and stack trace.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param ex Error object associated with this error message.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    errorWithStack(message: string, ex: Error, ...formatArgs: any[])

    /**
     * Log a fatal level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    fatal(message: string, ...formatArgs: any[])

    /**
     * Is a given log level enabled?
     *
     * @param level Level to check.
     */
    levelEnabled(level: LogLevel): boolean

    /**
     * Is trace log level enabled?
     */
    traceEnabled(): boolean

    /**
     * Is debug log level enabled?
     */
    debugEnabled(): boolean

    /**
     * Is info log level enabled?
     */
    infoEnabled(): boolean

    /**
     * Is warn log level enabled?
     */
    warnEnabled(): boolean

    /**
     * Is error log level enabled?
     */
    errorEnabled(): boolean

    /**
     * Is fatal log level enabled?
     */
    fatalEnabled(): boolean

    /**
     * Is the current log level `off`?
     */
    isOff(): boolean
}
