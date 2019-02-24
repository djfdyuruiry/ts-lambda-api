import { injectable } from "inversify"
import { Response, Request } from "lambda-api"

import { apiController, controllerProduces, header, pathParam, queryParam, response, request, rolesAllowed, produces, user, Controller, GET } from "../../../dist/index"

import { TestUser } from '../test-components/model/TestUser';

@apiController("/test")
@controllerProduces("text/plain")
@injectable()
export class TestController extends Controller {
    @GET()
    public get_Return() {
        return "OK"
    }

    @GET("/response-model")
    public get_ResponseModel() {
        this.response.send("OK")
    }

    @GET("/injected-response-model")
    public get_InjectedResponseModel(@response response: Response) {
        response.send("OK")
    }

    @GET("/no-return")
    public get_NoReturnOrResponseModel() {
        // this should cause the framework to throw an exception
    }

    @GET("/no-content")
    public get_NoContent(){
        this.response.status(204).send("")
    }

    @GET("/path-test/:name/:age")
    public get_PathTest(
        @pathParam("name") name: string,
        @pathParam("age") age: string
    ) {
        this.response.send(`Hey ${name}, you are ${age}`)
    }

    @GET("/injected-path-test/:name/:age")
    public get_InjectedPathTest(@request request: Request) {
        this.response.send(`Hey ${request.params["name"]}, you are ${request.params["age"]}`)
    }

    @GET("/query-test/")
    public get_QueryTest(@queryParam("magic") magic: string) {
        this.response.send(`Magic status: ${magic}`)
    }

    @GET("/injected-query-test/")
    public get_InjectedQueryTest(@request request: Request) {
        this.response.send(`Magic status: ${request.query["magic"]}`)
    }

    @GET("/produces")
    @produces("application/json")
    public get_Produces() {
        return {
            some: "value"
        }
    }

    @GET("/header-test")
    public get_HeaderTest(
        @header("x-test-header") testHeader: string
    ) {
        this.response.send(`Header: ${testHeader}`)
    }

    @GET("/injected-header-test")
    public get_InjectedHeaderTest(@request request: Request) {
        this.response.send(`Header: ${request.headers["x-test-header"]}`)
    }

    @GET("/raise-error")
    public raiseError() {
        throw new Error("all I do is throw an error")
    }

    @GET("/user-test")
    public userTest(@user testUser: TestUser) {
        return testUser.name
    }

    @GET("/restricted")
    @rolesAllowed("SPECIAL_USER")
    public restricted() {
        return "allowed in"
    }
}
