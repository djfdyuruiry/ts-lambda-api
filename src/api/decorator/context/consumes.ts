import { inspect } from "util"

import { ApiBody } from "../../../model/open-api/ApiBody"
import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for an endpoint method that details the HTTP request Content-Type header value.
 *
 * Overrides the controller value set by the `controllerConsumes` decorator, if any.
 *
 * @param contentType Request content type.
 */
export function consumes(contentType?: string, apiBodyInfo?: ApiBody) {
    return (classDefinition: object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)
        let operationInfo = endpoint.getOrCreateApiOperationInfo()
        let requestInfo = operationInfo.getOrCreateRequest()

        if (DecoratorRegistry.getLogger().debugEnabled()) {
            DecoratorRegistry.getLogger().debug("@consumes('%s'%s) decorator executed for endpoint: %s",
                contentType,
                apiBodyInfo ? `, ${inspect(apiBodyInfo)}` : "",
                endpoint.name)
        }

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
        let controller = DecoratorRegistry.getOrCreateController(classDefinition)
        let requestInfo = controller.getOrCreateRequestInfo()

        if (DecoratorRegistry.getLogger().debugEnabled()) {
            DecoratorRegistry.getLogger().debug("@controllerConsumes('%s'%s) decorator executed for controller: %s",
                contentType,
                apiBodyInfo ? `, ${inspect(apiBodyInfo)}` : "",
                controller.name)
        }

        controller.consumes = contentType
        requestInfo.contentType = contentType

        if (apiBodyInfo) {
            requestInfo.mergeInfo(apiBodyInfo)
        }
    }
}
