import { Request } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class HeaderParameterExtractor implements IParameterExtractor {
    public constructor(private readonly headerName: string) {
    }

    public extract(request: Request) {
        return request.headers[this.headerName]
    }
}
