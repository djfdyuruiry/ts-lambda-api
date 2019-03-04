import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"
import { ApiBody } from "../../../model/open-api/ApiBody"

/**
 * Decorator for an endpoint method that details the HTTP request Content-Type header value.
 *
 * Overrides the controller value set by the `controllerConsumes` decorator, if any.
 *
 * @param contentType Request content type.
 */
export function consumes(contentType?: string, apiBodyInfo?: ApiBody) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)
        let operationInfo = endpoint.getOrCreateApiOperationInfo()
        let requestInfo = operationInfo.getOrCreateRequest()

        endpoint.consumes = contentType
        requestInfo.contentType = contentType

        if (apiBodyInfo) {
            requestInfo.mergeInfo(apiBodyInfo)
        }
    }
}

/**
 * Decorator for a controller class that details the HTTP request Content-Type header value for
 * all endpoints.
 *
 * @param contentType Request content type.
 */
export function controllerConsumes(contentType: string, apiBodyInfo?: ApiBody) {
    return (classDefinition: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(classDefinition)
        let requestInfo = apiController.getOrCreateRequestInfo()

        apiController.consumes = contentType
        requestInfo.contentType = contentType

        if (apiBodyInfo) {
            requestInfo.mergeInfo(apiBodyInfo)
        }
    }
}
