import { injectable } from "inversify"

import { apiController, errorInterceptor, Controller, GET } from "../../../index"

import { TestDecoratorErrorInterceptor } from "../test-components/TestDecoratorErrorInterceptor"

@apiController("/test/ei-decorator")
@injectable()
export class ErrorDecoratorTestController extends Controller {
    @GET()
    @errorInterceptor(TestDecoratorErrorInterceptor)
    public get() {
        throw new Error("Oh no!")
    }
}
