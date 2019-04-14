import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class RequestParameterExtractor extends BaseParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "request"

    public constructor() {
        super(RequestParameterExtractor)
    }

    public extract(request: Request) {
        return request
    }
}
