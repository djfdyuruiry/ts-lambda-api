import { injectable } from "inversify"

import { apiController, GET } from "../../../../dist/ts-lambda-api"

@apiController("/nested")
@injectable()
export class NestedController {
    @GET()
    public get() {
        return "nested-ok"
    }
}
