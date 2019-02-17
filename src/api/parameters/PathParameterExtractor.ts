import { Request } from "lambda-api";

import { IParameterExtractor } from "./IParameterExtractor";

export class PathParameterExtractor implements IParameterExtractor {
    public constructor(private readonly paramName: string) {
    }

    public extract(request: Request) {
        return request.params[this.paramName]
    }
}
