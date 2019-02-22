import { ApiError } from "../model/ApiError"

export abstract class ErrorInterceptor {
    public abstract endpointTarget?: string
    public abstract controllerTarget?: string

    public shouldIntercept(controller: string, endpoint: string) {
        let match = false

        if (this.endpointTarget) {
            match = this.endpointTarget === endpoint
        }

        if (!match && this.controllerTarget) {
            match = this.controllerTarget === controller
        }

        if (!match && this.controllerTarget === "*") {
            match = true
        }

        return match
    }

    public abstract async intercept(apiError: ApiError): Promise<any>
}
