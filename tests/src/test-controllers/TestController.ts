import { injectable } from "inversify";
import { Response, Request } from "lambda-api";

import { apiController, GET, controllerProduces, Controller, pathParam, queryParam, response, request, produces } from "../../../index"

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
        // this should throw an exception
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
}
