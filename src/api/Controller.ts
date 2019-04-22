import { applyPatch } from "fast-json-patch"
import { injectable } from "inversify"
import { Request, Response } from "lambda-api"

import { JsonPatch } from "../model/JsonPatch"
import { ILogger } from "../util/logging/ILogger"

/**
 * Base class for API controllers. Provides access to the
 * current HTTP context as protected fields, and convience
 * method for applying JSON patches.
 */
@injectable()
export abstract class Controller {
    /**
     * Logger instance for this controller.
     */
    protected _logger: ILogger

    /**
     * The current HTTP request context.
     */
    protected request: Request

    /**
     * The current HTTP response context.
     */
    protected response: Response

    public setLogger(logger: ILogger) {
        this._logger = logger
    }

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
        if (this._logger) {
            this._logger.trace("Applying JSON patch\nObject: %j\nPatch: %j", obj, patch)
        }

        let result = applyPatch(obj, patch)

        return result.newDocument
    }
}
