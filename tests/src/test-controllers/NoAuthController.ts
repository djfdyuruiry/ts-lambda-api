import { injectable } from "inversify"

import { apiController, controllerNoAuth, Controller, GET } from "../../../dist/ts-lambda-api"

@apiController("/test-no-auth")
@controllerNoAuth
@injectable()
export class NoAuthController extends Controller {
    @GET()
    public get() {
        return "I really does what I likes"
    }
}
