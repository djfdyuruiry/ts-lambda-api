import { Request } from "lambda-api"

import { IAuthFilter } from "./IAuthFilter"
import { BasicAuth } from "../../model/security/BasicAuth"
import { Principal } from "../../model/security/Principal"
import { apiSecurity } from "../decorator/open-api/apiSecurity";

/**
 * IAuthFilter implementation that supports the HTTP Basic authentication scheme.
 */
@apiSecurity("basic", {
    scheme: "basic",
    type: "http"
})
export abstract class BasicAuthFilter<T extends Principal> implements IAuthFilter<BasicAuth, T> {
    public readonly authenticationSchemeName: string = "Basic"
    public abstract readonly name: string

    /**
     * If the authentication scheme is 'Basic', returns a BasicAuth instance containing
     * the username and password, otherwise returns undefined.
     *
     * @param request Request context to use.
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    public async extractAuthData(request: Request): Promise<BasicAuth | undefined> {
        if (request.auth.type === "Basic") {
            return {
                password: request.auth.password,
                username: request.auth.username
            }
        }
    }

    /**
     *
     * @param basicAuth
     */
    public abstract authenticate(basicAuth: BasicAuth): Promise<T | undefined>
}
