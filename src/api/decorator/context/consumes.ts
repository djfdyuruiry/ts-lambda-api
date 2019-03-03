import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"
import { ApiBodyInfo } from "../../../model/open-api/ApiBodyInfo"

/**
 * Decorator for an endpoint method that details the HTTP request Content-Type header value.
 *
 * Overrides the controller value set by the `controllerConsumes` decorator, if any.
 *
 * @param contentType Request content type.
 */
export function consumes(contentType: string, type?: symbol, classDef?: Function) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.consumes = contentType

        let requestInfo = endpoint.apiRequestInfo

        requestInfo.contentType = contentType
        requestInfo.type = type
        requestInfo.typeConstructor = classDef
    }
}

/**
 * Decorator for a controller class that details the HTTP request Content-Type header value for
 * all endpoints.
 *
 * @param contentType Request content type.
 */
export function controllerConsumes(contentType: string, type?: symbol, classDef?: Function) {
    return (classDefinition: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(classDefinition)

        apiController.consumes = contentType

        if (type || classDef) {
            apiController.apiRequestInfo = new ApiBodyInfo()

            apiController.apiRequestInfo.contentType = contentType
            apiController.apiRequestInfo.type = type
            apiController.apiRequestInfo.typeConstructor = classDef
        }
    }
}
