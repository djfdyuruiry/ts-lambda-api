import { injectable } from "inversify";

import { apiController, GET, controllerProduces, Controller, pathParam, queryParam } from "../../../index"

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


    @GET("/query-test/")
    public get_QueryTest(@queryParam("magic") magic: string) {
        this.response.send(`Magic status: ${magic}`)
    }
}
