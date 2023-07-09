import { ParameterStyle } from "openapi3-ts/dist/model/openapi31";

import { ApiBody } from "./ApiBody"

/**
 * Describes a parameter in a HTTP request.
 */
export class ApiParam extends ApiBody {
    /**
     * Defines how array/object is delimited. Possible styles
     * depend on the parameter location.
     *
     * See: https://swagger.io/docs/specification/serialization/
     */
    public style?: ParameterStyle

    /**
     * Specifies whether arrays and objects should generate
     * separate parameters for each array item or object property;
     * in other words, muiltiple parameters of the same name for array
     * values/object fields (true) or one string per parameter (false);
     * see style field.
     *
     * See: https://swagger.io/docs/specification/serialization/
     */
    public explode?: boolean

    /**
     * Is this parameter required in requests?
     */
    public required?: boolean
}
