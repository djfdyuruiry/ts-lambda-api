import { Request } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class QueryParameterExtractor implements IParameterExtractor {
    public readonly source = "query"

    public constructor(public readonly name: string) {
    }

    public extract(request: Request) {
        return request.query[this.name]
    }
}
