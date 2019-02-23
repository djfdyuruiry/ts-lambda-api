import { Principal } from '../../model/security/Principal';

export interface IAuthorizer<T extends Principal> {
    authorize(principal: T, role: string): Promise<boolean>
}
