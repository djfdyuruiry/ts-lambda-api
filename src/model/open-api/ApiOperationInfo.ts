import { ApiBodyInfo } from "./ApiBodyInfo"
import { ApiOperation } from "./ApiOperation"
import { ApiBody } from "./ApiBody"
import { IDictionary } from "../../util/IDictionary"

export class ApiOperationInfo extends ApiOperation {
    public getOrCreateRequest() {
        if (!this.request) {
            this.request = new ApiBodyInfo()
        }

        return this.request
    }

    public mergeInfo(otherInstance: ApiOperation) {
        if (otherInstance.name) {
            this.name = otherInstance.name
        }

        if (otherInstance.description) {
            this.description = otherInstance.description
        }

        if (otherInstance.request) {
            this.request = otherInstance.request
        }

        if (otherInstance.responses) {
            this.mergeResponses(otherInstance.responses)
        }
    }

    public mergeResponses(otherResponses: IDictionary<ApiBody>) {
        for (let statusCode in otherResponses) {
            if (!otherResponses.hasOwnProperty(statusCode)) {
                continue
            }

            let response = new ApiBodyInfo()

            if (otherResponses[statusCode]) {
                response.mergeInfo(otherResponses[statusCode])
            }

            this.responses[statusCode] = response
        }
    }
}
