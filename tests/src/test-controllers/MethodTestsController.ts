import { injectable } from "inversify"

import { apiController, fromBody, Controller, JsonPatch, GET, POST, PUT, PATCH, DELETE } from "../../../dist/typescript-lambda-api"

import { Person } from "../test-components/model/Person"

@apiController("/test/methods")
@injectable()
export class MethodTestsController extends Controller {
    @POST("/post")
    public post(@fromBody person: Person) {
        return person
    }

    @PUT("/put")
    public put(@fromBody person: Person) {
        return person
    }

    @PATCH("/patch")
    public patch(@fromBody jsonPatch: JsonPatch) {
        let somePerson: Person = {
            name: "Should Not Come Back",
            age: 42
        }

        return this.applyJsonPatch<Person>(jsonPatch, somePerson)
    }

    @DELETE("/delete")
    public delete() {
        this.response.status(204).send("")
    }

    @GET("/raise-error")
    public raiseError() {
        throw new Error("Panic!")
    }
}
