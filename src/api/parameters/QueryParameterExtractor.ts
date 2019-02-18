import { Request } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class QueryParameterExtractor implements IParameterExtractor {
    public constructor(private readonly paramName: string) {
    }

    public extract(request: Request) {
        return request.query[this.paramName]
    }
}
