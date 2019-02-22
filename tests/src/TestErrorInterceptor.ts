import { ApiError, ErrorInterceptor } from "../../index"

export class TestErrorInterceptor extends ErrorInterceptor {
    public endpointTarget?: string;
    public controllerTarget?: string;
    public wasInvoked: boolean
    public apiErrorPassed?: ApiError

    public constructor(forEndpoint?: string, forController?: string,
        private readonly returnValue: boolean = false) {
        super()

        this.endpointTarget = forEndpoint
        this.controllerTarget = forController

        this.wasInvoked = false
	}

    public async intercept(apiError: ApiError) {
        this.wasInvoked = true
        this.apiErrorPassed = apiError

        if (this.returnValue) {
            return "interceptor return value"
        }
    }
}