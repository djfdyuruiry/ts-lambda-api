import { Request, Response } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"

export class ResponseParameterExtractor implements IParameterExtractor {
    public extract(_: Request, response: Response) {
        return response
    }
}
