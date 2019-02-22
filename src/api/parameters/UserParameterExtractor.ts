import { Request, Response } from "lambda-api"

import { IParameterExtractor } from "./IParameterExtractor"
import { Principal } from '../../model/security/Principal';

export class UserParameterExtractor implements IParameterExtractor {
    public extract(request: Request, response: Response, user: Principal) {
        return user
    }
}
