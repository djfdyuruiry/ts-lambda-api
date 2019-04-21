import { AppConfig } from "../../model/AppConfig"
import { LogLevel } from "../../model/logging/LogLevel"
import { ILogger, LogFormat } from "./ILogger"
import { ConsoleLogger } from "./ConsoleLogger"

/**
 * Builds implementations of @see{ILogger}.
 */
export class LogFactory {
    /**
     * Build a new log factory using application config.
     *
     * @param appConfig Config object to read logging config from.
     * @param logLevel (Optional) Lowest level to log, defaults to `info`.
     * @param logFormat (Optional) Format to output log messages in, defaults to `string`.
     */
    public constructor(
        appConfig: AppConfig,
        private readonly logLevel: LogLevel = LogLevel.info,
        private readonly logFormat: LogFormat = "string"
    ) {
        if (appConfig && appConfig.serverLogger) {
            if (appConfig.serverLogger.level) {
                this.logLevel = appConfig.serverLogger.level
            }

            if (appConfig.serverLogger.format) {
                this.logFormat = appConfig.serverLogger.format
            }
        }
    }

    /**
     * Create a new logger.
     *
     * @param clazz The enclosing class that will use the new logger.
     */
    public getLogger(clazz: Function): ILogger {
        return new ConsoleLogger(clazz ? clazz.name : "?", this.logLevel, this.logFormat)
    }

    /**
     * Create a new logger using @see{AppConfig} config defaults.
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
     * @param logLevel (Optional) Lowest level to log, defaults to `info`.
     * @param logFormat (Optional) Format to output log messages in, defaults to `string`.
     */
    public static getCustomLogger(clazz: Function, level: LogLevel = LogLevel.info, format: LogFormat = "string") {
        let logFactory = new LogFactory({
            serverLogger: {
                format,
                level
            }
        })

        return logFactory.getLogger(clazz)
    }
}
