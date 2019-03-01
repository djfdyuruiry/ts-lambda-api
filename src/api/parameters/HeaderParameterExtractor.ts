import { Request } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class HeaderParameterExtractor implements IParameterExtractor {
    public readonly source = "header"

    public constructor(public readonly name: string) {
    }

    public extract(request: Request) {
        return request.headers[this.name]
    }
}
