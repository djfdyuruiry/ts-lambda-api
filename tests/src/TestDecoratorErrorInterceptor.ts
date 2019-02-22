import { injectable } from "inversify";

import { ErrorInterceptor } from "../../index"

@injectable()
export class TestErrorInterceptor extends ErrorInterceptor {
    public static wasInvoked: boolean

    public endpointTarget?: string
    public controllerTarget?: string

	public constructor() {
        super()

        TestErrorInterceptor.wasInvoked = false
	}

    public async intercept() {
        TestErrorInterceptor.wasInvoked = true
    }
}
