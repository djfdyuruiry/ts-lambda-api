import { ApiBodyInfo } from "./ApiBodyInfo";
import { IDictionary } from "../../util/IDictionary"

export class ApiOperation {
    public name?: string
    public description?: string
    public request?: ApiBodyInfo
    public responses?: IDictionary<ApiBodyInfo> = {}
}
