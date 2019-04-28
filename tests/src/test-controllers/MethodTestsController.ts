import { injectable } from "inversify"

import { apiController, body, Controller, JsonPatch, rawBody, GET, POST, PUT, PATCH, DELETE } from "../../../dist/ts-lambda-api"

import { Person } from "../test-components/model/Person"

@apiController("/test/methods")
@injectable()
export class MethodTestsController extends Controller {
    @POST("/post")
    public post(@body person: Person) {
        return person
    }

    @POST("/post-raw")
    public postFile(@rawBody file: Buffer) {
        this.response.sendFile(file)
    }

    @PUT("/put")
    public put(@body person: Person) {
        return person
    }

    @PATCH("/patch")
    public patch(@body jsonPatch: JsonPatch) {
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
