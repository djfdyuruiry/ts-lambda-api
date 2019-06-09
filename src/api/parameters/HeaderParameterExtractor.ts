import { Request } from "lambda-api"

import { ApiParam } from "../../model/open-api/ApiParam"
import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class HeaderParameterExtractor extends BaseParameterExtractor {
    public readonly source = "header"

    public constructor(public readonly name: string, apiParamInfo?: ApiParam) {
        super(HeaderParameterExtractor, apiParamInfo)
    }

    public extract(request: Request) {
        this.logger.debug("Extracting header '%s' from request", this.name)

        let headerValue = request.headers[this.name]

        this.logger.trace("Header '%s' value: %s", this.name, headerValue)

        return headerValue
    }
}
