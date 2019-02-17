import { injectable } from "inversify";

import { apiController, GET, controllerProduces, produces, Controller } from "../../../index"

@apiController("/test")
@controllerProduces("text/plain")
@injectable()
export class TestController extends Controller {
    @GET()
    public get_Return() {
        return "OK"
    }

    @GET("/response-model")
    @produces("text/plain")
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
}
