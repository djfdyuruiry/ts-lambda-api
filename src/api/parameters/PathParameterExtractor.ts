import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class PathParameterExtractor extends BaseParameterExtractor {
    public readonly source = "path"

    public constructor(public readonly name: string) {
        super(PathParameterExtractor)
    }

    public extract(request: Request) {
        return request.params[this.name]
    }
}
