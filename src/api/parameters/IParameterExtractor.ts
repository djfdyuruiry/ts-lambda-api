import { Request, Response } from "lambda-api"

import { ApiParam } from "../../model/open-api/ApiParam"
import { Principal } from "../../model/security/Principal"
import { LogFactory } from "../../util/logging/LogFactory"

export type ParameterSource = "query" | "header" | "path" | "cookie" | "virtual"

export interface IParameterExtractor {
    readonly source: ParameterSource
    readonly name: string
    readonly apiParamInfo?: ApiParam

    setLogger(logFactory: LogFactory)

    extract(request: Request, response: Response, user: Principal): any
}
