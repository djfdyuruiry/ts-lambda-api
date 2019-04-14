import { LogLevel } from "../../model/logging/LogLevel"

export type LogFormat = "string" | "json"

export interface ILogger {
    log(level: LogLevel, message: string, ...formatArgs: any[])
    trace(message: string, ...formatArgs: any[])
    debug(message: string, ...formatArgs: any[])
    info(message: string, ...formatArgs: any[])
    warn(message: string, ...formatArgs: any[])
    error(message: string, ...formatArgs: any[])
    fatal(message: string, ...formatArgs: any[])
}
