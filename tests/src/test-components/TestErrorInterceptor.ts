import { ApiError, ErrorInterceptor } from "../../../dist/typescript-lambda-api"

export class TestErrorInterceptor extends ErrorInterceptor {
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
