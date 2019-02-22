import { injectable } from "inversify";

import { ErrorInterceptor } from "../../index"

@injectable()
export class TestDecoratorErrorInterceptor extends ErrorInterceptor {
    public static wasInvoked: boolean

    public endpointTarget?: string
    public controllerTarget?: string

	public constructor() {
        super()

        TestDecoratorErrorInterceptor.wasInvoked = false
	}

    public async intercept() {
        TestDecoratorErrorInterceptor.wasInvoked = true
    }
}
