import { Request } from "lambda-api";

import { IParameterExtractor } from "./IParameterExtractor";

export class RequestParameterExtractor implements IParameterExtractor {
    public extract(request: Request) {
        return request
    }
}
