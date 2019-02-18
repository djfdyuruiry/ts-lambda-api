import { applyPatch } from 'fast-json-patch'
import { injectable } from "inversify"
import { Request, Response } from "lambda-api"

import { JsonPatch } from "../model/JsonPatch";

@injectable()
export abstract class Controller {
    protected request: Request
    protected response: Response

    public setRequest(request: Request) {
        this.request = request
    }

    public setResponse(response: Response) {
        this.response = response
    }

    protected applyJsonPatch<T>(patch: JsonPatch, obj: T) {
        let result = applyPatch(obj, patch)

        return result.newDocument
    }
}
