import { Request, Response } from "lambda-api"

import { ApiParam } from "../../model/open-api/ApiParam"
import { Principal } from "../../model/security/Principal"
import { ILogger } from "../../util/logging/ILogger"
import { LogFactory } from "../../util/logging/LogFactory"
import { IParameterExtractor, ParameterSource } from "./IParameterExtractor"

export abstract class BaseParameterExtractor implements IParameterExtractor {
    protected logger: ILogger

    public abstract readonly source: ParameterSource
    public abstract readonly name: string

    public constructor(
        private readonly clazz: Function,
        public readonly apiParamInfo?: ApiParam
    ) {

    }

    public setLogger(logFactory: LogFactory) {
        this.logger = logFactory.getLogger(this.clazz)
    }

    public abstract extract(request: Request, response: Response, user: Principal): any
}
