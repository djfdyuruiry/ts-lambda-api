import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class HeaderParameterExtractor extends BaseParameterExtractor {
    public readonly source = "header"

    public constructor(public readonly name: string) {
        super(HeaderParameterExtractor)
    }

    public extract(request: Request) {
        this.logger.debug("Extracting header '%s' from request", this.name)

        let headerValue = request.headers[this.name]

        this.logger.trace("Header '%s' value: %s", this.name, headerValue)

        return headerValue
    }
}
