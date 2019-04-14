import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class BodyParameterExtractor extends BaseParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "body"

    public constructor() {
        super(BodyParameterExtractor)
    }

    public extract(request: Request) {
        return request.body
    }
}
