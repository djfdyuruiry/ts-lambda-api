import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class QueryParameterExtractor extends BaseParameterExtractor {
    public readonly source = "query"

    public constructor(public readonly name: string) {
        super(QueryParameterExtractor)
    }

    public extract(request: Request) {
        this.logger.debug("Extracting query parameter '%s' from request", this.name)

        let queryParamValue = request.query[this.name]

        this.logger.trace("Query parameter '%s' value: %s", this.name, queryParamValue)

        return queryParamValue
    }
}
