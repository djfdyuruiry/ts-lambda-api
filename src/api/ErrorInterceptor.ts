import { ApiError } from "../model/ApiError"

export abstract class ErrorInterceptor {
    public constructor(private readonly forController?: string,
        private readonly forEndpoint?: string) {
    }

    public shouldIntercept(controller: string, endpoint: string) {
        if (this.forController) {
            return this.forController === controller
        }

        if (this.forEndpoint) {
            return this.forEndpoint === endpoint
        }

        return false
    }

    public abstract async intercept(apiError: ApiError): Promise<any>
}
