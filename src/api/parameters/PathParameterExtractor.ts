import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class PathParameterExtractor extends BaseParameterExtractor {
    public readonly source = "path"

    public constructor(public readonly name: string) {
        super(PathParameterExtractor)
    }

    public extract(request: Request) {
        this.logger.debug("Extracting path parameter '%s' from request", this.name)

        let pathParamValue = request.params[this.name]

        this.logger.trace("Path parameter '%s' value: %s", this.name, pathParamValue)

        return pathParamValue
    }
}
