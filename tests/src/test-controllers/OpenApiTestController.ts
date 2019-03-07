import { injectable } from "inversify"

import { api, apiController, apiOperation, apiRequest, apiResponse, fromBody, Controller, JsonPatch, GET, POST, PUT, PATCH, DELETE} from "../../../dist/typescript-lambda-api"

import { Person } from "../test-components/model/Person"

@apiController("/test/open-api")
@api("Open API Test", "Endpoints with OpenAPI decorators")
@injectable()
export class OpenApiTestControllerController extends Controller {
    @GET()
    @apiOperation({ name: "get stuff", description: "go get some stuff"})
    @apiResponse(200, {type: "string"})
    public get() {
        return "OK"
    }

    @POST()
    @apiOperation({name: "add stuff", description: "go add some stuff"})
    @apiRequest({class: Person})
    @apiResponse(201, {class: Person})
    public post(@fromBody person: Person) {
        return person
    }

    @POST("/plain")
    @apiOperation({ name: "add some plain stuff", description: "go get some plain stuff"})
    @apiRequest({contentType: "text/plain", type: "string"})
    @apiResponse(200, {type: "string"})
    public postString(@fromBody stuff: string) {
        return stuff
    }

    @PUT()
    @apiOperation({name: "put stuff", description: "go put some stuff"})
    @apiRequest({class: Person})
    @apiResponse(200, {class: Person})
    public put(@fromBody person: Person) {
        return person
    }

    @PATCH()
    @apiOperation({name: "patch stuff", description: "go patch some stuff"})
    @apiResponse(200, {class: Person})
    public patch(@fromBody jsonPatch: JsonPatch) {
        let somePerson: Person = {
            name: "Should Not Come Back",
            age: 42
        }

        return this.applyJsonPatch<Person>(jsonPatch, somePerson)
    }

    @DELETE()
    @apiOperation({name: "delete stuff", description: "go delete some stuff"})
    @apiResponse(204)
    public delete() {
        this.response.status(204).send("")
    }
}
