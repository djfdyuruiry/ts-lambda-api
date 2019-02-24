import { Request } from "lambda-api"

import { IAuthFilter } from "./IAuthFilter"
import { BasicAuth } from "../../model/security/BasicAuth"
import { Principal } from "../../model/security/Principal"

/**
 * IAuthFilter implementation that supports the HTTP Basic authentication scheme.
 */
export abstract class BasicAuthFilter<T extends Principal> implements IAuthFilter<BasicAuth, T> {
    /**
     * If the authentication scheme is 'Basic', returns a BasicAuth instance containing
     * the username and password, otherwise returns undefined.
     *
     * @param request Request context to use.
     */
    public async extractAuthData(request: Request): Promise<BasicAuth | undefined> {
        if (request.auth.type === "Basic") {
            return {
                username: request.auth.username,
                password: request.auth.password
            }
        }
    }

    /**
     *
     * @param basicAuth
     */
    public abstract async authenticate(basicAuth: BasicAuth): Promise<T | undefined>
}
