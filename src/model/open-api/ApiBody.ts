/**
 * Describes the body of a HTTP request or response.
 */
export class ApiBody {
    /**
     * Content (MIME) type.
     */
    public contentType?: string

    /**
     * Type of data the content stores, one of the following:
     *
     *  array
     *  array-array
     *  boolean
     *  boolean-array
     *  double
     *  double-array
     *  file
     *  int
     *  int-array
     *  number
     *  number-array
     *  object
     *  object-array
     *  string
     *  string-array
     *
     * If you specify this value, `class` is ignored.
     *
     */
    public type?: string

    /**
     * Class type that the content will store. This will
     * generate a schema in the OpenAPI spec for the given
     * type.
     *
     * If you specify this value, `type` is ignored.
     */
    public class?: Function

    /**
     * Description of this HTTP body.
     */
    public description?: string

    /**
     * Free form example of this body in plain
     * text. Setting this will prevent `type`
     * or `class` from setting auto-generated
     * examples.
     */
    public example?: string
}
