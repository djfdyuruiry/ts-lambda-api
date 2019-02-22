import { injectable } from "inversify"
import { Options, LoggerOptions, SerializerFunction } from "lambda-api"

@injectable()
export class AppConfig implements Options {
    base?: string
    callbackName?: string
    logger?: boolean | LoggerOptions
    mimeTypes?: {
        [key: string]: string
    }
    serializer?: SerializerFunction
    version?: string
}
