import { inspect } from "util"

import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class RequestParameterExtractor extends BaseParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "request"

    public constructor() {
        super(RequestParameterExtractor)
    }

    public extract(request: Request) {
        this.logger.debug("Injecting request as parameter")

        if (this.logger.traceEnabled()) {
            this.logger.trace("Request:\n%s", inspect(request))
        }

        return request
    }
}
