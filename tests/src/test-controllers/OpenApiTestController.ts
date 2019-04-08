import { injectable } from "inversify"

import { api, apiController, apiOperation, apiRequest, apiResponse, fromBody, Controller, JsonPatch, GET, POST, PUT, PATCH, DELETE} from "../../../dist/typescript-lambda-api"

import { ApiError } from "../test-components/model/ApiError"
import { ConstructorOnlyModel } from "../test-components/model/ConstructorOnlyModel"
import { Person } from "../test-components/model/Person"
import { EdgeCaseModel } from "../test-components/model/EdgeCaseModel";

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

    @GET("/constructor")
    @apiOperation({ name: "get constructor stuff", description: "go construct some stuff"})
    @apiResponse(200, {class: ConstructorOnlyModel})
    public getConstructorOnly() {
        return new ConstructorOnlyModel()
    }

    @GET("/edge-case")
    @apiOperation({ name: "get edge case stuff", description: "go get some edge case stuff"})
    @apiResponse(200, {class: EdgeCaseModel})
    public getEdgeCase() {
        return new EdgeCaseModel()
    }

    @POST()
    @apiOperation({name: "add stuff", description: "go add some stuff"})
    @apiRequest({class: Person})
    @apiResponse(201, {class: Person})
    @apiResponse(400, {class: ApiError})
    @apiResponse(500, {class: ApiError})
    public post(@fromBody person: Person) {
        return person
    }

    @POST("/custom-info")
    @apiOperation({
        name: "add custom stuff",
        description: "go add some custom stuff"
    })
    @apiRequest({
        class: Person,
        example: `{"name": "some name", "age": 22}`,
        description: "Details for a person"
    })
    @apiResponse(201, {
        class: Person,
        example: `{"name": "another name", "age": 30}`,
        description: "Uploaded person information"
    })
    @apiResponse(400, {
        class: ApiError,
        example: `{"statusCode": 400, "error": "you screwed up"}`,
        description: "A bad request error message"
    })
    public postCustomInfo(@fromBody person: Person) {
        return person
    }

    @POST("/plain")
    @apiOperation({ name: "add some plain stuff", description: "go get some plain stuff"})
    @apiRequest({contentType: "text/plain", type: "string"})
    @apiResponse(200, {type: "string"})
    public postString(@fromBody stuff: string) {
        return stuff
    }

    @POST("/files")
    @apiOperation({ name: "add file", description: "upload a file"})
    @apiRequest({contentType: "application/octet-stream", type: "file"})
    @apiResponse(201, {contentType: "application/octet-stream", type: "file"})
    public postFile(@fromBody fileContents: string) {
        return fileContents
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
