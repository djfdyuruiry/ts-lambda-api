import { injectable } from "inversify"

import { apiController, controllerErrorInterceptor, Controller, GET } from "../../../index"

import { TestDecoratorErrorInterceptor } from "../test-components/TestDecoratorErrorInterceptor"

@apiController("/test/controller-ei-decorator")
@controllerErrorInterceptor(TestDecoratorErrorInterceptor)
@injectable()
export class ControllerErrorDecoratorTestController extends Controller {
    @GET()
    public get() {
        throw new Error("Oh no!")
    }
}
