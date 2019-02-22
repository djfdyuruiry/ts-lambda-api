import { Request } from "lambda-api"

import { IAuthFilter } from "./IAuthFilter"
import { AuthenticationError } from "../../model/error/AuthenticationError"
import { Principal } from "../../model/security/Principal"
import { BasicAuth } from "../../model/security/BasicAuth"

export abstract class BasicAuthFilter<T extends Principal> implements IAuthFilter<BasicAuth, T> {
    public async invoke(request: Request) {
        if (request.auth.type !== "Basic") {
            throw new AuthenticationError()
        }

        let basicAuth: BasicAuth = {
            username: request.auth.username,
            password: request.auth.password
        }

        return await this.authenticate(basicAuth)
    }

    public abstract async authenticate(basicAuth: BasicAuth): Promise<T>
}
