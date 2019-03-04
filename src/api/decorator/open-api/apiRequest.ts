import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"
import { ApiBody } from "../../../model/open-api/ApiBody"

/**
 * Decorator that can be placed on an endpoint to describe the request
 * in any generated OpenAPI specification.
 *
 * @param apiBodyInfo Request body info.
 */
export function apiRequest(apiBodyInfo: ApiBody) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)
        let operationInfo = endpoint.getOrCreateApiOperationInfo()
        let requestInfo = operationInfo.getOrCreateRequest()

        requestInfo.mergeInfo(apiBodyInfo)
    }
}
