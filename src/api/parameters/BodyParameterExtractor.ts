import { Request } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class BodyParameterExtractor implements IParameterExtractor {
    public extract(request: Request) {
        return request.body
    }
}
