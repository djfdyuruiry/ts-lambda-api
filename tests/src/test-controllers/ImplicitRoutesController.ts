import { injectable } from "inversify"

import { apiController, fromBody, Controller, JsonPatch, GET, POST, PUT, PATCH, DELETE } from "../../../dist/ts-lambda-api"

import { Person } from "../test-components/model/Person"

@apiController("/test/implicit")
@injectable()
export class ImplicitRoutesController extends Controller {
    @GET()
    public get() {
        return "OK"
    }

    @POST()
    public post(@fromBody person: Person) {
        return person
    }

    @PUT()
    public put(@fromBody person: Person) {
        return person
    }

    @PATCH()
    public patch(@fromBody jsonPatch: JsonPatch) {
        let somePerson: Person = {
            name: "Should Not Come Back",
            age: 42
        }

        return this.applyJsonPatch<Person>(jsonPatch, somePerson)
    }

    @DELETE()
    public delete() {
        this.response.status(204).send("")
    }
}
