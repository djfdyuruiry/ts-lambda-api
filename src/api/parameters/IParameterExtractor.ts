import { Request, Response } from "lambda-api"

import { Principal } from "../../model/security/Principal"

export interface IParameterExtractor {
    extract(request: Request, response: Response, user: Principal): any
}
