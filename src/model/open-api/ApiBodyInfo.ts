import { ApiBody } from "./ApiBody"

export class ApiBodyInfo extends ApiBody {
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
