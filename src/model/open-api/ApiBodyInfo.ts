import { ApiBody } from "./ApiBody"

export class ApiBodyInfo extends ApiBody {
    public mergeInfo(otherInstance: ApiBody) {
        if (otherInstance.contentType) {
            this.contentType = otherInstance.contentType
        }

        if (otherInstance.type) {
            this.type = otherInstance.type
        }

        if (otherInstance.clazz) {
            this.clazz = otherInstance.clazz
        }

        if (otherInstance.description) {
            this.description = otherInstance.description
        }
    }
}
