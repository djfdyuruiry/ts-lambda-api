import { Request, Response } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"
import { Principal } from "../../model/security/Principal"

export class UserParameterExtractor extends BaseParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "user"

    public constructor() {
        super(UserParameterExtractor)
    }

    public extract(request: Request, response: Response, user: Principal) {
        return user
    }
}
