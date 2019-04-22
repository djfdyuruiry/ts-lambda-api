import { ApiBody } from "./ApiBody"

/**
 * Describes the body of a HTTP request or response.
 */
export class ApiBodyInfo extends ApiBody {
    /**
     * Copy any properties from another instance that are not
     * set in this instance.
     */
    public mergeInfo(otherInstance: ApiBody) {
        if (otherInstance.class) {
            this.class = otherInstance.class
        }

        if (otherInstance.contentType) {
            this.contentType = otherInstance.contentType
        }

        if (otherInstance.description) {
            this.description = otherInstance.description
        }

        if (otherInstance.example) {
            this.example = otherInstance.example
        }

        if (otherInstance.type) {
            this.type = otherInstance.type
        }
    }
}
