import { ParameterStyle } from "openapi3-ts/dist/model";

import { ApiBody } from "./ApiBody"

/**
 * Describes a parameter in a HTTP request.
 */
export class ApiParam extends ApiBody {
    /**
     * Defines how array/object is delimited. Possible styles
     * depend on the parameter location – path, query, header
     * or cookie.
     */
    public style?: ParameterStyle

    /**
     * Specifies whether arrays and objects should generate
     * separate parameters for each array item or object property.
     */
    public explode?: boolean

    /**
     * Is this parameter required in requests?
     */
    public required?: boolean
}
