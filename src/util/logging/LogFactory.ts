import { AppConfig } from "../../model/AppConfig"
import { LogLevel } from "../../model/logging/LogLevel"
import { ILogger, LogFormat } from "./ILogger"
import { ConsoleLogger } from "./ConsoleLogger"

/**
 * Builds implementations of [[ILogger]].
 */
export class LogFactory {
    /**
     * Build a new log factory using application config.
     *
     * @param appConfig Config object to read logging config from.
     * @param logLevel (Optional) Lowest level to log, defaults to `info`.
     * @param logFormat (Optional) Format to output log messages in, defaults to `string`.
     * @param logTimestamp (Optional) Print an ISO 8601 timestamp before every log message?
     *                     (string format only, defaults to `false`).
     */
    public constructor(
        appConfig: AppConfig,
        private readonly logLevel: LogLevel = LogLevel.info,
        private readonly logFormat: LogFormat = "string",
        private readonly logTimestamp = false
    ) {
        if (appConfig && appConfig.serverLogger) {
            if (appConfig.serverLogger.level) {
                this.logLevel = appConfig.serverLogger.level
            }

            if (appConfig.serverLogger.format) {
                this.logFormat = appConfig.serverLogger.format
            }

            if (appConfig.serverLogger.logTimestamp !== null &&
                appConfig.serverLogger.logTimestamp !== undefined) {
                this.logTimestamp = appConfig.serverLogger.logTimestamp
            }
        }
    }

    /**
     * Create a new logger.
     *
     * @param clazz The enclosing class that will use the new logger.
     */
    public getLogger(clazz: Function): ILogger {
        return new ConsoleLogger(clazz ? clazz.name : "?", this.logLevel, this.logFormat, this.logTimestamp)
    }

    /**
     * Create a new logger using [[AppConfig]] config defaults.
     *
     * @param clazz The enclosing class that will use the new logger.
     */
    public static getDefaultLogger(clazz: Function) {
        let logFactory = new LogFactory(new AppConfig())

        return logFactory.getLogger(clazz)
    }

    /**
     * Create a new logger using custom log configuration.
     *
     * @param clazz The enclosing class that will use the new logger.
     * @param level (Optional) Lowest level to log, defaults to `info`.
     * @param format (Optional) Format to output log messages in, defaults to `string`.
     * @param logTimestamp (Optional) Print an ISO 8601 timestamp before every log message?
     *                     (string format only, defaults to `false`).
     */
    public static getCustomLogger(
        clazz: Function,
        level: LogLevel = LogLevel.info,
        format: LogFormat = "string",
        logTimestamp = false
    ) {
        let logFactory = new LogFactory({
            serverLogger: {
                format,
                level,
                logTimestamp
            }
        })

        return logFactory.getLogger(clazz)
    }
}
