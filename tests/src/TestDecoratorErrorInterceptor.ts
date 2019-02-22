import { injectable } from "inversify"

import { ErrorInterceptor } from "../../index"

@injectable()
export class TestDecoratorErrorInterceptor extends ErrorInterceptor {
    public static wasInvoked: boolean

	public constructor() {
        super()

        TestDecoratorErrorInterceptor.wasInvoked = false
	}

    public async intercept() {
        TestDecoratorErrorInterceptor.wasInvoked = true
    }
}
