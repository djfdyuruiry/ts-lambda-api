import { inspect } from "util"

import { sprintf } from "sprintf-js"

import { LogLevel } from "../../model/logging/LogLevel"
import { UnderTest } from "../Environment"
import { ILogger, LogFormat } from "./ILogger"

/**
 * Logger implementation that uses the console for output.
 */
export class ConsoleLogger implements ILogger {
    private readonly useStringLogFormat: boolean

    /**
     * Build a new logger.
     *
     * @param clazz The enclosing class that will use the new logger.
     * @param logLevel Lowest level to log, defaults to `info`.
     * @param logFormat Format to output log messages in, defaults to `string`.
     */
    public constructor(
        private readonly clazz: string,
        public readonly level: LogLevel,
        public readonly format: LogFormat
    ) {
        this.useStringLogFormat = this.format === "string"
    }

    private formatMessage(message: string, ...formatArgs: any[]) {
        try {
            return sprintf(message, ...formatArgs)
        } catch (ex) {
            this.errorWithStack(
                "Failed to format log message, raw log message and parameters will be output",
                ex
            )

            // fall back to raw log message and args dump using inspect
            return `${message}\n${inspect(formatArgs)}`
        }
    }

    /**
     * Log a message with a custom level. Ignores messages of a lower log
     * level than the current level. If @see{Environment.UnderTest} is enabled
     * then this method will only log info messages or higher.
     *
     * @param level Level of the log message.
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    public log(level: LogLevel, message: string, ...formatArgs: any[]) {
        if (level < this.level) {
            return
        }

        let uppercaseLevel = LogLevel[level].toUpperCase()
        let now = new Date()
        let formattedMessage = message

        if (formatArgs && formatArgs.length > 0) {
            formattedMessage = this.formatMessage(message, ...formatArgs)
        }

        let logLine = this.useStringLogFormat ?
            sprintf(
                "%s %s %s - %s",
                now.toISOString(),
                uppercaseLevel,
                this.clazz,
                formattedMessage
            ) :
            JSON.stringify({
                level: uppercaseLevel,
                msg: formattedMessage,
                time: now.getTime()
            })

        if (UnderTest && level < LogLevel.info) {
            // prevent verbose logging when running under test,
            // build the message to test that, but only output it
            // if it is a warning or an error
            return
        }

        console.log(logLine)
    }

    /**
     * Log a trace level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    public trace(message: string, ...formatArgs: any[]) {
        this.log(LogLevel.trace, message, ...formatArgs)
    }

    /**
     * Log a debug level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    public debug(message: string, ...formatArgs: any[]) {
        this.log(LogLevel.debug, message, ...formatArgs)
    }

    /**
     * Log a info level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    public info(message: string, ...formatArgs: any[]) {
        this.log(LogLevel.info, message, ...formatArgs)
    }

    /**
     * Log a warn trace level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    public warn(message: string, ...formatArgs: any[]) {
        this.log(LogLevel.warn, message, ...formatArgs)
    }

    /**
     * Log a error level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    public error(message: string, ...formatArgs: any[]) {
        this.log(LogLevel.error, message, ...formatArgs)
    }

    /**
     * Log a error level message with an associated error and stack trace.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param ex Error object associated with this error message.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    public errorWithStack(message: string, ex: Error, ...formatArgs: any[]) {
        this.log(LogLevel.error, `${message}\n${ex ? ex.stack : ""}`, ...formatArgs)
    }

    /**
     * Log a fatal level message.
     *
     * @param message String which can contain `sprintf` style format placeholders.
     * @param formatArgs (Optional) Arguments which are passed to `sprintf` to format the message.
     */
    public fatal(message: string, ...formatArgs: any[]) {
        this.log(LogLevel.fatal, message, ...formatArgs)
    }

    // TODO: do a isX isY for levels to make it easier for log clients to selective do expensive operations for logs
}
