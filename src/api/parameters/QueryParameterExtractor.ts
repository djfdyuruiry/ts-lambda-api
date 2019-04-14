import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class QueryParameterExtractor extends BaseParameterExtractor {
    public readonly source = "query"

    public constructor(public readonly name: string) {
        super(QueryParameterExtractor)
    }

    public extract(request: Request) {
        return request.query[this.name]
    }
}
