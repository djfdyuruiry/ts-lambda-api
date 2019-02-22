import { injectable } from "inversify"

import { GET } from "../../../index"

@injectable()
export class NoRootPathController {
    @GET("/test/no-root-path")
    public get() {
        return "OK"
    }
}
