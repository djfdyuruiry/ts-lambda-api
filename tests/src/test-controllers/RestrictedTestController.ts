import { injectable } from "inversify"

import { apiController, controllerRolesAllowed, Controller, GET } from "../../../dist/typescript-lambda-api"

@apiController("/test-restricted")
@controllerRolesAllowed("SUPER_SPECIAL_USER", "SPECIAL_USER")
@injectable()
export class RestrictedTestController extends Controller {
    @GET()
    public get() {
        return "I does what I likes"
    }
}
