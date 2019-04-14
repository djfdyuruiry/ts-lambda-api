import { Request, Response } from "lambda-api"

import { Principal } from "../../model/security/Principal"
import { ILogger } from "../../util/logging/ILogger"
import { LogFactory } from "../../util/logging/LogFactory"
import { IParameterExtractor } from "./IParameterExtractor"

export abstract class BaseParameterExtractor implements IParameterExtractor {
    protected logger: ILogger

    public abstract readonly source
    public abstract readonly name

    public constructor(private readonly clazz: Function) {}

    public setLogger(logFactory: LogFactory) {
        this.logger = logFactory.getLogger(this.clazz)
    }

    public abstract extract(request: Request, response: Response, user: Principal): any
}
