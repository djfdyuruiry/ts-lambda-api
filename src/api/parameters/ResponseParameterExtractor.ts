import { Request, Response } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class ResponseParameterExtractor extends BaseParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "response"

    public constructor() {
        super(ResponseParameterExtractor)
    }

    public extract(_: Request, response: Response) {
        return response
    }
}
