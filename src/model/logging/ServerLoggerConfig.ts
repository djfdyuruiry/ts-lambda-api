import { LogLevel } from "./LogLevel"
import { LogFormat } from "../../util/logging/ILogger"

export class ServerLoggerConfig {
    public level: LogLevel
    public format?: LogFormat
}
