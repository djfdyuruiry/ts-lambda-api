import { Request, Response } from "lambda-api"

import { Controller } from "../api/Controller"

/**
 * Context of an error thrown by an endpoint method.
 *
 * Instances of this class are passed to error interceptors.
 */
export class ApiError {
    /**
     * Error thrown by the endpoint method.
     */
    public error: Error

    /**
     * Parameter values passed to the endpoint method.
     */
    public endpointMethodParameters: any[]

    /**
     * Endpoint method defintion.
     */
    public endpointMethod: Function

    /**
     * Controller instance used to call endpoint method.
     */
    public endpointController: Controller

    /**
     * HTTP request context.
     */
    public request: Request

    /**
     * HTTP response context.
     */
    public response: Response
}
