import { Principal } from "../../model/security/Principal"

/**
 * Authorizer to perform role based checks for a principal.
 *
 * @param U Principal data type, the type must extend `Principal`
 */
export interface IAuthorizer<T extends Principal> {
    /**
     * A human readable name for this authorizer.
     */
    readonly name: string

    /**
     * Check that a principal has a named role.
     *
     * @param principal The current principal context.
     * @param role The name of the role to check for.
     * @returns `true` if the principal is authorised to use the name role, otherwise `false`.
     */
    authorize(principal: T, role: string): Promise<boolean>
}
