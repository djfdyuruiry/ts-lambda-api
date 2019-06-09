import { Request } from "lambda-api"

import { ApiParam } from "../../model/open-api/ApiParam"
import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class QueryParameterExtractor extends BaseParameterExtractor {
    public readonly source = "query"

    public constructor(public readonly name: string, apiParamInfo?: ApiParam) {
        super(QueryParameterExtractor, apiParamInfo)
    }

    public extract(request: Request) {
        this.logger.debug("Extracting query parameter '%s' from request", this.name)

        let queryParamValue = request.query[this.name]

        this.logger.trace("Query parameter '%s' value: %s", this.name, queryParamValue)

        return queryParamValue
    }
}
