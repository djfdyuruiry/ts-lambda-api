import { injectable } from "inversify"

import { ErrorInterceptor } from "../../../dist/index"

@injectable()
export class TestDecoratorErrorInterceptor extends ErrorInterceptor {
    public static wasInvoked: boolean = false

    public async intercept() {
        TestDecoratorErrorInterceptor.wasInvoked = true
    }
}
