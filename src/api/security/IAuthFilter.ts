import { Request } from "lambda-api"

import { Principal } from "../../model/security/Principal"

export interface IAuthFilter<T, U extends Principal> {
    invoke(request: Request): Promise<U>
}
