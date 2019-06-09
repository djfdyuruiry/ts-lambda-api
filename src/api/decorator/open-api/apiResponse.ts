import { inspect } from "util"

import { ApiBody } from "../../../model/open-api/ApiBody"
import { IDictionary } from "../../../util/IDictionary"
import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator that can be placed on an endpoint to describe a possible response
 * in any generated OpenAPI specification.
 *
 * @param statusCode HTTP status code that will be sent in this response.
 * @param apiBodyInfo Information about the response body generated.
 */
export function apiResponse(statusCode: number, apiBodyInfo?: ApiBody) {
    return (classDefinition: Object, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)
        let responses: IDictionary<ApiBody> = {}

        if (DecoratorRegistry.getLogger().debugEnabled()) {
            DecoratorRegistry.getLogger().debug("@apiResponse(%d%s) decorator executed for endpoint: %s",
                statusCode,
                apiBodyInfo ? `, ${inspect(apiBodyInfo)}` : "",
                endpoint.name)
        }

        responses[`${statusCode}`] = apiBodyInfo

        endpoint.getOrCreateApiOperationInfo().mergeResponses(responses)
    }
}
