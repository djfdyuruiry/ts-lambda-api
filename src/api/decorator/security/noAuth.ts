import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for an endpoint method that marks it as not requiring authentication.
 */
export function noAuth(classDefinition: Object | Function, methodName: string) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.noAuth = true
}

/**
 * Decorator for a controller class that marks it as not requiring authentication.
 */
export function controllerNoAuth(classDefinition: Function) {
    let apiController = DecoratorRegistry.getOrCreateController(classDefinition)

    apiController.noAuth = true
}
