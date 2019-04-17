import { interfaces } from "inversify"
import { API, Request, Response } from "lambda-api"

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

export class Endpoint {
    private readonly logger: ILogger
    private readonly endpointSummary: string

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

    public register(api: API) {
        let registerMethod = this.mapHttpMethodToCall(api, this.endpointInfo.httpMethod)

        this.logger.debug("Registering endpoint: %s", this.endpointSummary)

        registerMethod(
            this.endpointInfo.fullPath,
            async (req, res) => {
                try {
                    let returnValue = await this.invoke(req, res)

                    this.logger.info("Endpoint invoked successfully, returning response. Endpoint: %s",
                        this.endpointSummary)
                    this.logger.trace("Endpoint' return value: %j", returnValue)

                    return returnValue
                } catch (ex) {
                    this.logger.errorWithStack("Error processing endpoint request", ex)

                    throw ex
                }
            }
        )
    }

    // entry point for lambda-api request engine
    private async invoke(request: Request, response: Response) {
        let principal = await this.authenticateAndAuthorizeRequest(request, response)

        if (this.responseSent(response)) {
            // 401 or 403 response was sent
            return
        }

        this.logger.info("Invoking endpoint: %s", this.endpointSummary)

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
            this.logger.debug("Authentication disabled for endpoint: %s", this.endpointSummary)

            return
        }

        let authResult = await this.authenticateRequest(request, response)

        if (!authResult.authenticated) {
            this.sendStatusCodeResponse(401, response)
        }

        if (!await this.authorizeRequest(authResult.principal)) {
            this.sendStatusCodeResponse(403, response)
        }

        return authResult.principal
    }

    private async authenticateRequest(request: Request, response: Response) {
        let authResult = new AuthResult()
        let authScheme = ""

        if (this.middlewareRegistry.authFilters.length < 1) {
            this.logger.debug("No authentication filters registered")

            authResult.authenticated = true
            return authResult
        }

        this.logger.info("Authenticating request")

        for (let filter of this.middlewareRegistry.authFilters) {
            authScheme = filter.authenticationSchemeName

            let authData = await filter.extractAuthData(request)

            if (authData) {
                this.logger.debug("Authenticating request using authentication filter: %s", filter.name)

                authResult.principal = await filter.authenticate(authData)
            } else {
                // authData extraction was either aborted or failed
                this.logger.info("No auth data returned by authentication filter: %s", filter.name)
            }

            authResult.authenticated =
                (authResult.principal !== null && authResult.principal !== undefined)

            if (authResult.authenticated) {
                this.logger.info("Authenticated request using authentication filter: %s", filter.name)

                // return after finding a filter that authenticates the user
                return authResult
            }

            this.logger.debug("Request not authenticated using authentication filter: %s", filter.name)
        }

        if (!authResult.authenticated && authScheme) {
            this.logger.debug("Request not authenticated, returning 'WWW-Authenticate' header in" +
                " response with scheme: %s", authScheme)

            response.header("WWW-Authenticate", authScheme)
        }

        return authResult
    }

    private sendStatusCodeResponse(statusCode: number, response: Response) {
        this.logger.debug("Returning status code (HTTP %d) only response for endpoint: %s", statusCode, response)

        response.status(statusCode)
                .removeHeader("content-type")
                .header("content-type", "text/plain")
                .send("")
    }

    private async authorizeRequest(principal: Principal) {
        let roles = this.endpointInfo.roles

        if (!roles || roles.length < 1) {
            this.logger.debug("Authorization not required as no roles were defined for endpoint: %s",
                this.endpointSummary)

            return true
        }

        if (this.middlewareRegistry.authorizers.length < 1) {
            throw new Error("Role restrictions were declared but no authorizer was registered in the" +
                ` middleware registry, path: ${this.endpointInfo.path} | endpoint: ${this.endpointInfo.name}`)
        }

        this.logger.info("Authorizing request by principal '%s' for endpoint: %s",
            principal.name, this.endpointSummary)
        this.logger.debug("'%j' role(s) defined for endpoint: %s", roles, this.endpointSummary)

        for (let authorizer of this.middlewareRegistry.authorizers) {
            // endpoint roles, if defined, override controller roles
            for (let role of roles) {
                if (await authorizer.authorize(principal, role)) {
                    this.logger.info("Authorized request by principal '%s' using authorizer '%s' and role '%s'," +
                        " for endpoint: %s", principal.name, authorizer.name, role, this.endpointSummary)

                    return true
                }

                this.logger.debug("Request by principal '%s' not authorized using authorizer '%s' and role '%s'," +
                    " for endpoint: %s", principal.name, authorizer.name, role, this.endpointSummary)
            }
        }

        this.logger.debug("Request by principal '%s' was not authorized for endpoint: %s",
            principal.name, this.endpointSummary)

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

        this.logger.debug("Building instance of controller: %s", controllerName)

        let controller: Controller =
            this.controllerFactory(this.endpointInfo.controller.classConstructor)

        if (typeof(controller.setRequest) === "function") {
            this.logger.debug("Injecting request into controller: %s", controllerName)

            controller.setRequest(request)
        }

        if (typeof(controller.setResponse) === "function") {
            this.logger.debug("Injecting response into controller: %s", controllerName)

            controller.setResponse(response)
        }

        if (typeof(controller.setLogger) === "function") {
            this.logger.debug("Injecting logger into controller: %s", controllerName)

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
        this.logger.debug("Building dynamic controller instance for endpoint: %s", this.endpointSummary)

        let dynamicController = {
            request,
            response
        }

        dynamicController[this.endpointInfo.methodName] = this.endpointInfo.method

        return dynamicController
    }

    private setResponseContentType(response: Response) {
        let produces = this.endpointInfo.responseContentType

        if (produces) {
            this.logger.debug("Setting response 'Content-Type' header: %s", produces)

            response.removeHeader("Content-Type")
                .header("Content-Type", produces)
        }
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
        let parameters = this.buildEndpointParameters(request, response, principal)

        let controllerName = this.endpointInfo.controller ?
            this.endpointInfo.controller.name :
            "<dynamic>";

        try {
            this.logger.debug("Invoking controller '%s' method: %s",
                controllerName, this.endpointInfo.methodName)
            this.logger.trace("Passing %d arguments to method '%s' in controller '%s': %j",
                parameters.length,
                controllerName,
                this.endpointInfo.methodName,
                parameters)

            return await method.apply(controller, parameters)
        } catch (ex) {
            this.logger.error("Error occurred in method '%s' in controller '%s'",
                this.endpointInfo.methodName, controllerName)

            let errorInterceptor = this.getMatchingErrorInterceptor()

            if (errorInterceptor) {
                this.logger.debug("Invoking error interceptor for method '%s' in controller '%s'",
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
                    this.logger.debug("Response sent by error interceptor")

                    return interceptorResponse
                }

                this.logger.debug("Error interceptor did not send a response")
            }

            throw ex
        }
    }

    private buildEndpointParameters(request: Request, response: Response, principal: Principal): any[] {
        this.logger.debug("Building parameters for endpoint: %s", this.endpointSummary)

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
            this.logger.debug("Building decorator declared error interceptor for endpoint: %s",
                this.endpointSummary)

            decoratorInterceptor = this.errorInteceptorFactory(this.endpointInfo.endpointErrorInterceptor)
        }

        if (decoratorInterceptor) {
            this.logger.debug("Using decorator declared error interceptor for endpoint: %s",
                this.endpointSummary)

            decoratorInterceptor.controllerTarget = this.endpointInfo.getControllerPropOrDefault(c => c.name)
            decoratorInterceptor.endpointTarget = this.endpointInfo.name

            return decoratorInterceptor
        }

        this.logger.debug("Searching for matching error interceptor in middleware registry for endpoint: %s",
            this.endpointSummary)

        return this.middlewareRegistry.errorInterceptors
            .find(i =>
                i.shouldIntercept(
                    this.endpointInfo.getControllerPropOrDefault(c => c.name),
                    this.endpointInfo.name
                )
            )
    }
}
