import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for an endpoint method that marks it as not requiring authentication.
 */
export function noAuth(classDefinition: Object | Function, methodName: string) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    DecoratorRegistry.getLogger().debug("@noAuth() decorator executed for endpoint: %s", endpoint.name)

    endpoint.noAuth = true
}

/**
 * Decorator for a controller class that marks it not requiring authentication for any of it's endpoints.
 */
export function controllerNoAuth(classDefinition: Function) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition)

    DecoratorRegistry.getLogger().debug("@controllerNoAuth() decorator executed for controller: %s", controller.name)

    controller.noAuth = true
}
