import { injectable } from "inversify"

import { apiController, apiOperation, apiRequest, apiResponse, consumes, controllerConsumes, body, Controller, POST } from "../../../dist/ts-lambda-api"

import { Person } from "../test-components/model/Person"

@apiController("/test/consumes")
@controllerConsumes("text/plain")
@injectable()
export class ConsumesTestControllerController extends Controller {
    @POST()
    @apiOperation({name: "add stuff", description: "go add some stuff"})
    @apiRequest({class: Person})
    @apiResponse(201, {class: Person})
    public post(@body person: Person) {
        return person
    }

    @POST("/xml")
    @apiOperation({name: "add xml stuff", description: "go add some xml stuff"})
    @consumes("application/xml")
    @apiRequest({class: Person})
    @apiResponse(201, {class: Person})
    public xmlPost(@body person: Person) {
        return person
    }
}
