import { injectable } from "inversify";

import { ApiError } from "../../model/ApiError"

/**
 * Base class for implementing error interceptors that are invoked
 * to handle errors thrown by endpoints.
 */
@injectable()
export abstract class ErrorInterceptor {
    public endpointTarget?: string
    public controllerTarget?: string

    public constructor() {
        this.endpointTarget = "*"
    }

    /**
     * Should this interceptor handle a given endpoint error?
     *
     * @param controller Class name of the controller where the error occurred.
     * @param endpoint Name of the endpoint; format is ${ClassName}:${MethodName}.
     *
     * @returns If this is a global error interceptor, denoted by a endpointTarget
     *          that equals "*", return true. Otherwise return whether the endpointTarget
     *          or controllerTarget match the controller or endpoint respectively.
     */
    public shouldIntercept(controller: string, endpoint: string) {
        return this.endpointTarget === "*" ||
            this.endpointTarget === endpoint ||
            this.controllerTarget === controller
    }

    /**
     * Error interceptors implement this method to handle errors.
     *
     * @param apiError Details of error that was thrown by an endpoint, contains
     *                 the request and response context, which can used to return a
     *                 custom HTTP response.
     * @returns Value that you want to send back in the HTTP response; optional.
     */
    public abstract intercept(apiError: ApiError): Promise<any>
}
