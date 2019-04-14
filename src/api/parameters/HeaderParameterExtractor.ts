import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class HeaderParameterExtractor extends BaseParameterExtractor {
    public readonly source = "header"

    public constructor(public readonly name: string) {
        super(HeaderParameterExtractor)
    }

    public extract(request: Request) {
        return request.headers[this.name]
    }
}
