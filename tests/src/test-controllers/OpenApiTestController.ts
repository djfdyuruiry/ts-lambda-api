import { injectable } from "inversify"

import { api, apiController, apiIgnoreController, apiOperation, apiRequest, apiResponse, body, header, pathParam, queryParam, rawBody, Controller, JsonPatch, GET, POST, PUT, PATCH, DELETE} from "../../../dist/ts-lambda-api"

import { ApiError } from "../test-components/model/ApiError"
import { ArrayofPrimitivesExample } from '../test-components/model/ArrayOfPrimitivesExample'
import { ConstructorOnlyModel } from "../test-components/model/ConstructorOnlyModel"
import { EdgeCaseModel } from "../test-components/model/EdgeCaseModel"
import { People } from "../test-components/model/People"
import { Person } from "../test-components/model/Person"
import { PrimitiveExample } from '../test-components/model/PrimitiveExample'

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

    @GET("/example-array-objects")
    @apiOperation({ name: "get example array of objects", description: "go get example array of objects"})
    @apiResponse(200, {type: "object-array", example: `[{"age":23,"name":"carlos","gender":"male","city":"Dubai"},{"age":24,"name":"carlos","gender":"male","city":"Dubai"},{"age":25,"name":"carlos","gender":"male","city":"Dubai"}]` })
    public getExampleArrayOfObjects() {
        return [{"age":23,"name":"carlos","gender":"male","city":"Dubai"},{"age":24,"name":"carlos","gender":"male","city":"Dubai"},{"age":25,"name":"carlos","gender":"male","city":"Dubai"}]
    }

    @GET("/primitive-class-example")
    @apiOperation({ name: "get primitive class example", description: "go get primitive class example"})
    @apiResponse(200, { class: PrimitiveExample })
    public getPrimitiveClassExample() {
        return PrimitiveExample.example()
    }

    @GET("/primitive-array-class-example")
    @apiOperation({ name: "get primitive array class example", description: "go get primitive array class example"})
    @apiResponse(200, { class: ArrayofPrimitivesExample })
    public getPrimitiveArrayClassExample() {
        return ArrayofPrimitivesExample.example()
    }

    @GET("/array-objects")
    @apiOperation({ name: "get array of objects", description: "go get array of objects"})
    @apiResponse(200, { class: People })
    public getArrayOfObjects() {
        return People.example()
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
    public post(@body person: Person) {
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
    public postCustomInfo(@body person: Person) {
        return person
    }

    @POST("/plain")
    @apiOperation({ name: "add some plain stuff", description: "go get some plain stuff"})
    @apiRequest({contentType: "text/plain", type: "string"})
    @apiResponse(200, {type: "string"})
    public postString(@body stuff: string) {
        return stuff
    }

    @POST("/files")
    @apiOperation({ name: "add file", description: "upload a file"})
    @apiRequest({contentType: "application/octet-stream", type: "file"})
    @apiResponse(201, {contentType: "application/octet-stream", type: "file"})
    public postFile(@rawBody file: Buffer) {
        this.response.sendFile(file)
    }

    @PUT()
    @apiOperation({name: "put stuff", description: "go put some stuff"})
    @apiRequest({class: Person})
    @apiResponse(200, {class: Person})
    public put(@body person: Person) {
        return person
    }

    @PATCH()
    @apiOperation({name: "patch stuff", description: "go patch some stuff"})
    @apiResponse(200, {class: Person})
    public patch(@body jsonPatch: JsonPatch) {
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

    @GET("/path-info-test/:pathTest")
    @apiOperation({name: "path info test", description: "go get query info stuff"})
    public getPathTest(@pathParam("pathTest", { description: "test path param" }) test: string) {
        this.response.status(200).send("")
    }

    @GET("/query-info-test")
    @apiOperation({name: "query info test", description: "go get query info stuff"})
    public getQueryTest(
        @queryParam("queryTest", { description: "test query param", type: "int" }) test: string,
        @queryParam("queryTest2", { description: "test query param 2", type: "int-array", required: true, style: "pipeDelimited", explode: false, example: "1|2|3" }) test2: string
    ) {
        this.response.status(200).send("")
    }

    @GET("/header-info-test")
    @apiOperation({name: "header info test", description: "go get header info stuff"})
    public getHeaderTest(
        @header("x-test-header", { description: "test header param" }) test: string,
        @header("x-test-header2", { description: "test header param 2", class: Person, contentType: "application/json" }) test2: string
    ) {
        this.response.status(200).send("")
    }
}