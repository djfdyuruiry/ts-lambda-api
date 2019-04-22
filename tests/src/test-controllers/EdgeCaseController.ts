import { injectable } from "inversify"

import { api, apiController, consumes, controllerConsumes, Controller, POST } from "../../../dist/ts-lambda-api"
import { Person } from '../test-components/model/Person';

// this controller uses parameters from `api`, `controllerConsumes` and `consumes` not used anywhere else
@apiController("/test/edge-case-controller")
@api("Edge Cases")
@controllerConsumes("application/xml", { contentType: "application/xml", class: Person })
@injectable()
export class EdgeCaseController extends Controller {
    @POST()
    @consumes("application/xml", { contentType: "application/xml", class: Person })
    public post() {
        return "nada"
    }
}
