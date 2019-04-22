import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for an endpoint method that sets the HTTP response Content-Type header value.
 *
 * Overrides the controller value set by the `controllerProduces` decorator, if any.
 *
 * @param contentType Content-Type header value.
 */
export function produces(contentType: string) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        DecoratorRegistry.getLogger().debug("@produces('%s') decorator executed for endpoint: %s",
            contentType, endpoint.name)

        endpoint.produces = contentType
    }
}

/**
 * Decorator for a controller class that sets the HTTP response Content-Type header value for
 * all endpoints.
 *
 * @param contentType Content-Type header value.
 */
export function controllerProduces(contentType: string) {
    return (classDefinition: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(classDefinition)

        DecoratorRegistry.getLogger().debug("@controllerProduces('%s') decorator executed for controller: %s",
            contentType, apiController.name)

        apiController.produces = contentType
    }
}
