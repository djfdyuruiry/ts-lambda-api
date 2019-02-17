import { injectable } from "inversify"

import { apiController, fromBody, GET, POST, PUT, PATCH, DELETE } from "../../../index"

import { Person } from "./model/Person";

@apiController("/test/methods")
@injectable()
export class MethodTestsController {
    @POST("/post")
    public post(@fromBody person: Person) {
        return person
    }

    @PUT("/put")
    public put(@fromBody person: Person) {
        return person
    }

    @PATCH("/patch")
    public patch() {
        return "OK"
    }

    @DELETE("/delete")
    public delete() {
        return "OK"
    }
}
