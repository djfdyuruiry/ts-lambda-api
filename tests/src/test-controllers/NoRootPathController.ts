import { injectable } from "inversify";

import { GET, Controller } from "../../../index"

@injectable()
export class NoRootPathController extends Controller {
    @GET("/test/no-root-path")
    public get() {
        this.response.send("OK")
    }
}
