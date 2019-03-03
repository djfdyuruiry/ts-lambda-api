import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"
import { ApiBodyInfo } from "../../../model/open-api/ApiBodyInfo"

/**
 * Decorator for an endpoint method that details the HTTP request Content-Type header value.
 *
 * Overrides the controller value set by the `controllerConsumes` decorator, if any.
 *
 * @param contentType Request content type.
 */
export function consumes(contentType: string, apiBodyInfo?: ApiBodyInfo) {
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
export function controllerConsumes(contentType: string, apiBodyInfo?: ApiBodyInfo) {
    return (classDefinition: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(classDefinition)

        apiController.consumes = contentType
        apiController.apiRequestInfo.contentType = contentType

        if (apiBodyInfo) {
            apiController.apiRequestInfo.mergeInfo(apiBodyInfo)
        }
    }
}
