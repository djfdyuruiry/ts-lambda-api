import { Request, Response } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class ResponseParameterExtractor implements IParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "response"

    public extract(_: Request, response: Response) {
        return response
    }
}
