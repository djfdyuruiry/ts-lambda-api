import { applyPatch } from "fast-json-patch"
import { injectable } from "inversify"
import { Request, Response } from "lambda-api"

import { JsonPatch } from "../model/JsonPatch"

/**
 * Base class for API controllers. Provides access to the
 * current HTTP context as protected fields, and convience
 * method for applying JSON patches.
 */
@injectable()
export abstract class Controller {
    /**
     * The current HTTP request context.
     */
    protected request: Request

    /**
     * The current HTTP response context.
     */
    protected response: Response

    public setRequest(request: Request) {
        this.request = request
    }

    public setResponse(response: Response) {
        this.response = response
    }

    /**
     * Apply a set of JSON patch operations to an
     * object instance.
     *
     * @param T The type of object to be patched.
     * @param patch The operations to apply.
     * @param obj The object instance to apply operations to.
     */
    protected applyJsonPatch<T>(patch: JsonPatch, obj: T) {
        let result = applyPatch(obj, patch)

        return result.newDocument
    }
}
