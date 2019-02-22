import { ApiError } from "../model/ApiError"

export abstract class ErrorInterceptor {
    public abstract endpointTarget?: string
    public abstract controllerTarget?: string

    public shouldIntercept(controller: string, endpoint: string) {
        if (this.controllerTarget) {
            return this.controllerTarget === controller
        }

        if (this.endpointTarget) {
            return this.endpointTarget === endpoint
        }

        return false
    }

    public abstract async intercept(apiError: ApiError): Promise<any>
}
