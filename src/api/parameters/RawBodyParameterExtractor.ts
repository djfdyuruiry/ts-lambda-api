import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class RawBodyParameterExtractor extends BaseParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "raw-body"

    public constructor() {
        super(RawBodyParameterExtractor)
    }

    public extract(request: Request) {
        this.logger.debug("Extracting raw body from request")

        let rawBody = request.isBase64Encoded ?
            Buffer.from(request.rawBody, "base64") :
            Buffer.from(request.rawBody)

        this.logger.trace("Request raw body size in bytes: %d", rawBody.byteLength)

        return rawBody
    }
}
