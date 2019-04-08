import { Request } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class BodyParameterExtractor implements IParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "body"

    public extract(request: Request) {
        return request.body
    }
}
