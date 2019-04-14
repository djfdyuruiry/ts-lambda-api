import { AppConfig } from "../../model/AppConfig"
import { ILogger, LogFormat } from "./ILogger"
import { Logger } from "./Logger"
import { LogLevel } from "../../model/logging/LogLevel"

export class LogFactory {
    public constructor(
        appConfig: AppConfig,
        private readonly logLevel: LogLevel = LogLevel.info,
        private readonly logFormat: LogFormat = "string"
    ) {
        if (appConfig.serverLogger) {
            this.logLevel = appConfig.serverLogger.level

            if (appConfig.serverLogger.format) {
                this.logFormat = appConfig.serverLogger.format
            }
        }
    }

    public getLogger(clazz: Function): ILogger {
        return new Logger(clazz.name, this.logLevel, this.logFormat)
    }

    public static getDefaultLogger(clazz: Function) {
        let logFactory = new LogFactory(new AppConfig())

        return logFactory.getLogger(clazz)
    }
}
