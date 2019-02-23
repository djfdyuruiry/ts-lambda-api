import { ErrorInterceptor } from "./error/ErrorInterceptor";
import { IAuthorizer } from './security/IAuthorizer';
import { IAuthFilter } from './security/IAuthFilter';
import { Principal } from '../model/security/Principal';

export class MiddlewareRegistry {
    private _authFilters: IAuthFilter<any, Principal>[]
    private _authorizers: IAuthorizer<Principal>[]
    private _errorInterceptors: ErrorInterceptor[]

    get authFilters() {
        return this._authFilters
    }

    get authAuthorizers() {
        return this._authorizers
    }

    get errorInterceptors() {
        return this._errorInterceptors
    }

    public constructor() {
        this._authFilters = []
        this._authorizers = []
        this._errorInterceptors = []
    }

    public addAuthFilter(authFiler: IAuthFilter<any, Principal>) {
        if (!authFiler) {
            throw new Error("Null or undefined authFiler passed to MiddlewareRegistry::authFiler")
        }

        this._authFilters.push(authFiler)
    }

    public addAuthorizer(authorizer: IAuthorizer<Principal>) {
        if (!authorizer) {
            throw new Error("Null or undefined authorizer passed to MiddlewareRegistry::addAuthorizer")
        }

        this._authorizers.push(authorizer)
    }

    public addErrorInterceptor(errorInterceptor: ErrorInterceptor) {
        if (!errorInterceptor) {
            throw new Error("Null or undefined errorInterceptor passed to MiddlewareRegistry::addErrorInterceptor")
        }

        this._errorInterceptors.push(errorInterceptor)
    }
}
