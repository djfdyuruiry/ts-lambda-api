import { Request, Response } from "lambda-api";

export interface IParameterExtractor {
    extract(request: Request, response: Response): any;
}
