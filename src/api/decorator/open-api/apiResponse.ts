import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"
import { ApiBodyInfo } from "../../../model/open-api/ApiBodyInfo";
import { IDictionary } from "../../../util/IDictionary"

/**
 * Decorator that can be placed on an endpoint to describe a possible response
 * in any generated OpenAPI specification.
 *
 * @param statusCode HTTP status code that will be sent in this response.
 * @param apiBodyInfo Information about the response body generated.
 */
export function apiRespone(statusCode: number, apiBodyInfo: ApiBodyInfo) {
    return (classDefinition: Object, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)
        let responses: IDictionary<ApiBodyInfo> = {}

        responses[`${statusCode}`] = apiBodyInfo

        endpoint.getOrCreateApiOperationInfo().mergeResponses(responses)
    }
}
