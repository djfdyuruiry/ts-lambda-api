import { injectable } from "inversify"

import { apiController, errorInterceptor, Controller, GET } from "../../../index"

import { TestErrorInterceptor } from "../TestErrorInterceptor"

@apiController("/test/ei-decorator")
@injectable()
export class ErrorDecoratorTestController extends Controller {
    @GET()
    @errorInterceptor(TestErrorInterceptor)
    public get() {
        throw new Error("Oh no!")
    }
}
