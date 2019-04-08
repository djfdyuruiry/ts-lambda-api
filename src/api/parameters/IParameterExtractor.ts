import { Request, Response } from "lambda-api"

import { Principal } from "../../model/security/Principal"

export type ParameterSource = "query" | "header" | "path" | "cookie" | "virtual"

export interface IParameterExtractor {
    readonly source: ParameterSource
    readonly name: string

    extract(request: Request, response: Response, user: Principal): any
}
