import { ApiBodyInfo } from "./ApiBodyInfo";
import { IDictionary } from "../../util/IDictionary"

/**
 * Describes an API endpoint.
 */
export class ApiOperation {
    /**
     * Name of the endpoint.
     */
    public name?: string

    /**
     * Description of the endpoint.
     */
    public description?: string

    /**
     * Information about the endpoint request body.
     */
    public request?: ApiBodyInfo

    /**
     * Map of HTTP status codes (as strings) to response
     * body info. This means that you can describe the success
     * body of a 200 response as well as the error body of a 500
     * response.
     */
    public responses?: IDictionary<ApiBodyInfo> = {}
}
