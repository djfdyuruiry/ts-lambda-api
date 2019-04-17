import { inspect } from "util"

import { Request, Response } from "lambda-api"

import { LogLevel } from "../../model/logging/LogLevel"
import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class ResponseParameterExtractor extends BaseParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "response"

    public constructor() {
        super(ResponseParameterExtractor)
    }

    public extract(_: Request, response: Response) {
        this.logger.debug("Injecting response as parameter")

        if (this.logger.level === LogLevel.trace) {
            this.logger.trace("Response:\n%s", inspect(response))
        }

        return response
    }
}
