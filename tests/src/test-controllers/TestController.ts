import { injectable } from "inversify";

import { apiController, GET, produces, Controller } from "../../../index"

@apiController("/test")
@produces("text/plain")
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
    }

    @GET("/no-content")
    public get_NoContent(){
        this.response.status(204).send("")
    }
}
