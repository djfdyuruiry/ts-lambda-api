import { IDictionary } from "../../util/IDictionary";

import { ApiBodyInfo } from "./ApiBodyInfo"

export class ApiOperationInfo {
    public name?: string
    public description?: string
    public request?: ApiBodyInfo
    public responses: IDictionary<ApiBodyInfo> = {}

    public getOrCreateRequest() {
        if (!this.request) {
            this.request = new ApiBodyInfo()
        }

        return this.request
    }

    public mergeInfo(otherInstance: ApiOperationInfo) {
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

    public mergeResponses(otherResponses: IDictionary<ApiBodyInfo>) {
        for (let statusCode in otherResponses) {
            if (!otherResponses.hasOwnProperty(statusCode)) {
                continue
            }

            this.responses[statusCode] = otherResponses[statusCode]
        }
    }
}
