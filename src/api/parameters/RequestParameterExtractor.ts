import { Request } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class RequestParameterExtractor implements IParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "request"

    public extract(request: Request) {
        return request
    }
}
