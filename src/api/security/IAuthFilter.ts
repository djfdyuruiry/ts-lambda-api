import { Request } from "lambda-api"

import { Principal } from "../../model/security/Principal"

/**
 * Authentication filter that can extract authentication data
 * from a HTTP request and preform authentication using that data.
 *
 * @param T Authentication data type
 * @param U Principal data type, the type must extend `Principal`
 */
export interface IAuthFilter<T, U extends Principal> {
    /**
     * String to use in `WWW-Authenticate` header when returing
     * a HTTP 401 response, see:
     *   https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
     */
    readonly authenticationSchemeName: string

    /**
     * A human readable name for this authentication filter.
     */
    readonly name: string

    /**
     * Extract an instance of the authentication data type `T`
     * from a HTTP request. If extraction is not possible due to
     * missing request headers/data, `undefined` should be returned.
     *
     * @param request Request context to use.
     * @returns Instance of type `T` or `undefined` on extraction failure.
     */
    extractAuthData(request: Request): Promise<T | undefined>

    /**
     * Attempt to authorise a user suing the authentication data supplied.
     * An instance of the principal type `U` should be returned on authentication
     * success, otherwise `undefined` should be returned.
     *
     * @param authData An instance of the authentication data type `T`.
     * @returns Instance of type `U` or `undefined` on authentication failure.
     */
    authenticate(authData: T): Promise<U | undefined>
}
