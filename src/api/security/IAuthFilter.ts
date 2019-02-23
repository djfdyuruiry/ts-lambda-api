import { Request } from "lambda-api"

import { Principal } from "../../model/security/Principal"

export interface IAuthFilter<T, U extends Principal> {
    extractAuthData(request: Request): Promise<T | undefined>
    authenticate(authData: T): Promise<U | undefined>
}
