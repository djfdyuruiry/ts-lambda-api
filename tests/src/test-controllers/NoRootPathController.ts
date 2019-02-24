import { injectable } from "inversify"

import { GET } from "../../../src/typescript-lambda-api"

@injectable()
export class NoRootPathController {
    @GET("/test/no-root-path")
    public get() {
        return "OK"
    }
}
