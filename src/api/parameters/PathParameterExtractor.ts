import { Request } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class PathParameterExtractor implements IParameterExtractor {
    public readonly source = "path"

    public constructor(public readonly name: string) {
    }

    public extract(request: Request) {
        return request.params[this.name]
    }
}
