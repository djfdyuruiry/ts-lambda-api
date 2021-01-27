import { inspect } from "util"

import { interfaces } from "inversify"
import { API, Request, Response } from "lambda-api"

import { LogLevel } from "../model/logging/LogLevel"
import { EndpointInfo } from "../model/reflection/EndpointInfo"
import { AuthResult } from "../model/security/AuthResult"
import { Principal } from "../model/security/Principal"
import { ILogger } from "../util/logging/ILogger"
import { LogFactory } from "../util/logging/LogFactory"
import { Controller } from "./Controller"
import { ErrorInterceptor } from "./error/ErrorInterceptor"
import { MiddlewareRegistry } from "./MiddlewareRegistry"

export type ControllerFactory = (constructor: Function) => Controller
export type ErrorInterceptorFactory = (type: interfaces.ServiceIdentifier<ErrorInterceptor>) => ErrorInterceptor

/**
 * Wrapper for endpoint method that proxies lamba-api requests.
 */
export class Endpoint {
    private readonly logger: ILogger
    private readonly endpointSummary: string

    /**
     * @param endpointInfo Endpoint to wrap.
     * @param controllerFactory Function used to build controllers, for use with InversifyJS.
     * @param errorInteceptorFactory Function used to build error interceptors, for use with InversifyJS.
     * @param middlewareRegistry Server middleware registry for authentication, authorisation and error interceptors.
     * @param logFactory Initialised log factory.
     */
    public constructor(
        private readonly endpointInfo: EndpointInfo,
        private readonly controllerFactory: ControllerFactory,
        private readonly errorInteceptorFactory: ErrorInterceptorFactory,
        private readonly middlewareRegistry: MiddlewareRegistry,
        private readonly logFactory: LogFactory
    ) {
        this.logger = logFactory.getLogger(Endpoint)
        this.endpointSummary = `[${endpointInfo.httpMethod}] ${endpointInfo.fullPath}`
    }

    /**
     * Register this endpoint with a lambda-api instance.
     *
     * @param api Instance to register endpoint with.
     */
    public register(api: API) {
        let registerMethod = this.mapHttpMethodToCall(api, this.endpointInfo.httpMethod)

        this.log(LogLevel.debug, "Registering endpoint")

        registerMethod(
            this.endpointInfo.fullPath,
            async (req, res) => {
                try {
                    if (this.logger.traceEnabled()) {
                        this.log(LogLevel.trace, "Endpoint request:\n%s", inspect(req))
                    }

                    let returnValue = await this.invoke(req, res)

                    this.log(LogLevel.info, "Endpoint invoked successfully, returning response")

                    this.log(LogLevel.trace, "Endpoint return value: %j", returnValue)

                    if (this.logger.traceEnabled()) {
                        this.log(LogLevel.trace, "Endpoint '%s' response:\n%s", inspect(res))
                    }

                    return returnValue
                } catch (ex) {
                    this.logError("Error processing endpoint request", ex)

                    throw ex
                }
            }
        )
    }

    private log(logLevel: LogLevel, message: string, ...formatArgs: any[]) {
        this.logger.log(logLevel, `${this.endpointSummary} - ${message}`, ...formatArgs)
    }

    private logError(message: string, ex: Error, ...formatArgs: any[]) {
        this.logger.errorWithStack(`${this.endpointSummary} - ${message}`, ex, ...formatArgs)
    }

    // entry point for lambda-api request engine
    private async invoke(request: Request, response: Response) {
        let principal = await this.authenticateAndAuthorizeRequest(request, response)

        if (this.responseSent(response)) {
            // 401 or 403 response was sent
            return
        }

        this.log(LogLevel.info, "Invoking endpoint")

        let controller = this.buildControllerInstance(request, response)

        this.setResponseContentType(response)

        let endpointResponse = await this.invokeControllerMethod(controller, request, response, principal)

        if (!this.responseSent(response, endpointResponse)) {
            throw new Error("no response was sent by or value returned from endpoint method, " +
                `path: ${this.endpointInfo.path} | endpoint: ${this.endpointInfo.name}`)
        }

        return endpointResponse
    }

    private async authenticateAndAuthorizeRequest(request: Request, response: Response) {
        if (this.endpointInfo.authenticationDisabled) {
            this.log(LogLevel.debug, "Authentication disabled for endpoint")

            return
        }

        let authResult = await this.authenticateRequest(request, response)

        if (!authResult.authenticated) {
            this.log(LogLevel.info, "Request authentication failed")

            if (!this.responseSent(response)) {
                this.sendStatusCodeResponse(401, response)
            }
        }

        if (!await this.authorizeRequest(authResult.principal)) {
            this.log(LogLevel.info, "Request authorization failed")

            if (!this.responseSent(response)) {
                this.sendStatusCodeResponse(403, response)
            }
        }

        return authResult.principal
    }

    private async authenticateRequest(request: Request, response: Response) {
        let authResult = new AuthResult()
        let authScheme = ""

        if (this.middlewareRegistry.authFilters.length < 1) {
            this.log(LogLevel.debug, "No authentication filters registered")

            authResult.authenticated = true
            return authResult
        }

        this.log(LogLevel.info, "Authenticating request")

        for (let filter of this.middlewareRegistry.authFilters) {
            authScheme = filter.authenticationSchemeName

            let authData = await filter.extractAuthData(request)

            if (authData) {
                this.log(LogLevel.debug, "Authenticating request using authentication filter: %s", filter.name)

                authResult.principal = await filter.authenticate(authData)
            } else {
                // authData extraction was either aborted or failed
                this.log(LogLevel.debug, "No auth data returned by authentication filter: %s", filter.name)
            }

            authResult.authenticated =
                (authResult.principal !== null && authResult.principal !== undefined)

            if (authResult.authenticated) {
                this.log(LogLevel.debug, "Authenticated request principal '%s' using authentication filter: %s",
                    authResult.principal.name, filter.name)

                // return after finding a filter that authenticates the user
                return authResult
            }

            this.log(LogLevel.debug, "Request not authenticated using authentication filter: %s", filter.name)
        }

        if (!authResult.authenticated && authScheme) {
            this.log(LogLevel.debug, "Request not authenticated, returning 'WWW-Authenticate' header in" +
                " response with scheme: %s", authScheme)

            response.header("WWW-Authenticate", authScheme)
        }

        return authResult
    }

    private sendStatusCodeResponse(statusCode: number, response: Response) {
        this.log(
            LogLevel.info,
            "Returning status code only response for endpoint: HTTP %d",
            statusCode
        )

        response.status(statusCode)
                .removeHeader("content-type")
                .header("content-type", "text/plain")
                .send("")
    }

    private async authorizeRequest(principal: Principal) {
        let roles = this.endpointInfo.roles

        if (!roles || roles.length < 1) {
            this.log(LogLevel.debug, "Authorization not required as no roles were defined for endpoint")

            return true
        }

        if (this.middlewareRegistry.authorizers.length < 1) {
            throw new Error("Role restrictions were declared but no authorizer was registered in the" +
                ` middleware registry, path: ${this.endpointInfo.path} | endpoint: ${this.endpointInfo.name}`)
        }

        this.log(LogLevel.info, "Authorizing request")

        this.log(LogLevel.debug, "Authorizing current principal '%s'", principal.name)
        this.log(LogLevel.debug, "Roles defined for endpoint: '%j'", roles)

        for (let authorizer of this.middlewareRegistry.authorizers) {
            // endpoint roles, if defined, override controller roles
            for (let role of roles) {
                if (await authorizer.authorize(principal, role)) {
                    this.log(
                        LogLevel.debug,
                        "Authorized request by principal '%s' using authorizer '%s' and role '%s'",
                        principal.name,
                        authorizer.name,
                        role
                    )

                    return true
                }

                this.log(
                    LogLevel.debug,
                    "Request by principal '%s' not authorized using authorizer '%s' and role '%s'",
                    principal.name,
                    authorizer.name,
                    role
                )
            }
        }

        this.log(
            LogLevel.debug,
            "Request by principal '%s' was not authorized",
            principal.name
        )

        return false
    }

    private responseSent(response?: Response, endpointResponse?: any) {
        let rawRes: any = response

        return endpointResponse || (rawRes && rawRes._state === "done")
    }

    private buildControllerInstance(request: Request, response: Response): any {
        if (!this.endpointInfo.controller) {
            return this.buildDynamicControllerInstance(request, response)
        }

        let controllerName = this.endpointInfo.controller.name

        this.log(LogLevel.debug, "Building instance of controller: %s", controllerName)

        let controller: Controller =
            this.controllerFactory(this.endpointInfo.controller.classConstructor)

        if (typeof(controller.setRequest) === "function") {
            this.log(LogLevel.debug, "Injecting request into controller: %s", controllerName)

            controller.setRequest(request)
        }

        if (typeof(controller.setResponse) === "function") {
            this.log(LogLevel.debug, "Injecting response into controller: %s", controllerName)

            controller.setResponse(response)
        }

        if (typeof(controller.setLogger) === "function") {
            this.log(LogLevel.debug, "Injecting logger into controller: %s", controllerName)

            controller.setLogger(
                this.logFactory.getLogger(this.endpointInfo.controller.classConstructor)
            )
        }

        return controller
    }

    /**
     * If an endpoint is function only (has no controller bound to it), we
     * build a dynamic controller which simulates a controller instance.
     */
    private buildDynamicControllerInstance(request: Request, response: Response) {
        this.log(LogLevel.debug, "Building dynamic controller instance for endpoint")

        let dynamicController = {
            request,
            response
        }

        dynamicController[this.endpointInfo.methodName] = this.endpointInfo.method

        return dynamicController
    }

    private setResponseContentType(response: Response) {
        let produces = this.endpointInfo.responseContentType

        if (!produces) {
            return
        }

        this.log(LogLevel.debug, "Setting response 'Content-Type' header: %s", produces)

        response.removeHeader("Content-Type")
            .header("Content-Type", produces)
    }

    private mapHttpMethodToCall(api: API, method: string) {
        if (method === "GET") {
            return api.get
        } else if (method === "POST") {
            return api.post
        } else if (method === "PUT") {
            return api.put
        } else if (method === "PATCH") {
            return api.patch
        } else if (method === "DELETE") {
            return api.delete
        }

        throw new Error(`Unrecognised HTTP method ${method}`)
    }

    private async invokeControllerMethod(
        controller: Controller, request: Request, response: Response, principal: Principal
    ) {
        let method: Function = controller[this.endpointInfo.methodName]
        let controllerName = this.endpointInfo.controller ?
            this.endpointInfo.controller.name :
            "<dynamic>";

        let parameters;

        try {
          parameters = this.buildEndpointParameters(request, response, principal)
        } catch (ex) {
          const errors = ex.reduce((list, error) => list.concat(Object.values(error.constraints)), []);
          this.log(LogLevel.error, "Errors occurred extracting parameters for method '%s' in controller '%s': %j",
                  this.endpointInfo.methodName,
                  controllerName,
                  errors)

          response.status(400)
          response.send({ errors })
          return
        }

        try {
            this.log(LogLevel.debug, "Invoking controller '%s' method: %s",
                controllerName, this.endpointInfo.methodName)

            if (this.logger.traceEnabled()) {
                this.log(LogLevel.trace, "Passing %d arguments to method '%s' in controller '%s': %s",
                    parameters.length,
                    this.endpointInfo.methodName,
                    controllerName,
                    inspect(parameters))
            }

            return await method.apply(controller, parameters)
        } catch (ex) {
            this.log(LogLevel.error, "Error occurred in method '%s' in controller '%s'",
                this.endpointInfo.methodName, controllerName)

            let errorInterceptor = this.getMatchingErrorInterceptor()

            if (errorInterceptor) {
                this.log(LogLevel.debug, "Invoking error interceptor for method '%s' in controller '%s'",
                    this.endpointInfo.methodName, controllerName)

                let interceptorResponse = await errorInterceptor.intercept({
                    endpointController: controller,
                    endpointMethod: method,
                    endpointMethodParameters: parameters,
                    error: ex,
                    request,
                    response
                })

                if (this.responseSent(response, interceptorResponse)) {
                    this.log(LogLevel.debug, "Response sent by error interceptor")

                    return interceptorResponse
                }

                this.log(LogLevel.debug, "Error interceptor did not send a response")
            }

            throw ex
        }
    }

    private buildEndpointParameters(request: Request, response: Response, principal: Principal): any[] {
        this.log(LogLevel.debug, "Building parameters for endpoint")

        return this.endpointInfo
            .parameterExtractors
            .map(pe => {
                pe.setLogger(this.logFactory)
                return pe.extract(request, response, principal)
            })
    }

    private getMatchingErrorInterceptor() {
        let decoratorInterceptor: ErrorInterceptor

        if (this.endpointInfo.endpointErrorInterceptor) {
            this.log(LogLevel.debug, "Building decorator declared error interceptor for endpoint")

            decoratorInterceptor = this.errorInteceptorFactory(this.endpointInfo.endpointErrorInterceptor)
        }

        if (decoratorInterceptor) {
            this.log(LogLevel.debug, "Using decorator declared error interceptor for endpoint")

            decoratorInterceptor.controllerTarget = this.endpointInfo.getControllerPropOrDefault(c => c.name)
            decoratorInterceptor.endpointTarget = this.endpointInfo.name

            return decoratorInterceptor
        }

        this.log(LogLevel.debug, "Searching for matching error interceptor in middleware registry for endpoint")

        return this.middlewareRegistry.errorInterceptors
            .find(i =>
                i.shouldIntercept(
                    this.endpointInfo.getControllerPropOrDefault(c => c.name),
                    this.endpointInfo.name
                )
            )
    }
}
