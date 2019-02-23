import { injectable } from "inversify";

import { ApiError } from "../../model/ApiError"

@injectable()
export abstract class ErrorInterceptor {
    public endpointTarget?: string
    public controllerTarget?: string

    public constructor() {
        this.endpointTarget = "*"
    }

    public shouldIntercept(controller: string, endpoint: string) {
        return this.endpointTarget === "*" ||
            this.endpointTarget === endpoint ||
            this.controllerTarget === controller
    }

    public abstract async intercept(apiError: ApiError): Promise<any>
}
