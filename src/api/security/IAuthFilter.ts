import { Request } from "lambda-api"

import { Principal } from "../../model/security/Principal"

export interface IAuthFilter<T, U extends Principal> {
    extractAuthData(request: Request): Promise<T>
    authenticate(authData: T): Promise<U>
}
