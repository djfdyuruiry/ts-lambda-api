import { Principal } from "../model/security/Principal"
import { ILogger } from "../util/logging/ILogger"
import { LogFactory } from "../util/logging/LogFactory"
import { ErrorInterceptor } from "./error/ErrorInterceptor"
import { IAuthFilter } from "./security/IAuthFilter"
import { IAuthorizer } from "./security/IAuthorizer"

/**
 * Holds all the middleware that will be applied to incoming HTTP
 * requests before or after calling endpoint methods.
 */
export class MiddlewareRegistry {
    private _authFilters: IAuthFilter<any, Principal>[]
    private _authorizers: IAuthorizer<Principal>[]
    private _errorInterceptors: ErrorInterceptor[]
    private readonly logger: ILogger

    /**
     * Authentication filters to apply. These are chained, meaning only
     * one of the filters registered needs to authenticate a user to
     * for the request to be authenticated.
     */
    public get authFilters() {
        return this._authFilters
    }

    /**
     * Authorizers to apply. These are chained, meaning only
     * one of the authorizers registered needs to authorise a user against
     * a role for the request to be authorized.
     */
    public get authorizers() {
        return this._authorizers
    }

    /**
     * Error interceptors to use. Multiple interceptors can be
     * registered against one endpoint/controller, however only
     * the first interceptor registered will be invoked.
     */
    public get errorInterceptors() {
        return this._errorInterceptors
    }

    public constructor(logFactory: LogFactory) {
        this._authFilters = []
        this._authorizers = []
        this._errorInterceptors = []

        this.logger = logFactory.getLogger(MiddlewareRegistry)
    }

    /**
     * Add an authentication filter.
     *
     * @param authFilter The filter to add.
     * @throws If the `authFilter` parameter is null or undefined.
     */
    public addAuthFilter(authFilter: IAuthFilter<any, Principal>) {
        if (!authFilter) {
            throw new Error("Null or undefined authFiler passed to MiddlewareRegistry::authFiler")
        }

        this.logger.info("Registering authentication filter: %s", authFilter.name)

        this._authFilters.push(authFilter)
    }

    /**
     * Adds an authorizer.
     *
     * @param authorizer The authorizer to add.
     * @throws If the `authorizer` parameter is null or undefined.
     */
    public addAuthorizer(authorizer: IAuthorizer<Principal>) {
        if (!authorizer) {
            throw new Error("Null or undefined authorizer passed to MiddlewareRegistry::addAuthorizer")
        }

        this.logger.info("Registering authorizer: %s", authorizer.name)

        this._authorizers.push(authorizer)
    }

    /**
     * Adds an error interceptor.
     *
     * @param errorInterceptor The interceptor to add.
     * @throws If the `errorInterceptor` parameter is null or undefined.
     */
    public addErrorInterceptor(errorInterceptor: ErrorInterceptor) {
        if (!errorInterceptor) {
            throw new Error("Null or undefined errorInterceptor passed to MiddlewareRegistry::addErrorInterceptor")
        }

        this.logger.info("Registering error interceptor for endpoint '%s' and controller '%s'",
            errorInterceptor.endpointTarget, errorInterceptor.controllerTarget)

        this._errorInterceptors.push(errorInterceptor)
    }
}
