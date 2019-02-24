import { DecoratorRegistry } from "../../reflection/DecoratorRegistry";

/**
 * Decorator for an endpoint method that defines roles that are allowed to use it.
 *
 * Overrides the controller roles set by the `controllerRolesAllowed` decorator, if any.
 *
 * Role based authorization is managed by an `IAuthorizer` implementation registered
 * with the current app.
 *
 * @param roleNames Names of roles that are permitted to use the endpoint.
 */
export function rolesAllowed(...roleNames: string[]) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.rolesAllowed = roleNames
    }
}

/**
 * Decorator for a controller class that defines roles that are allowed to user all
 * endpoints within it.
 *
 * Role based authorization is managed by a `IAuthorizer` implementation registered
 * with the current app.
 *
 * @param roleNames Names of roles that are permitted to use the endpoints in this controller.
 */
export function controllerRolesAllowed(...roleNames: string[]) {
    return (classDefinition: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(classDefinition)

        apiController.rolesAllowed = roleNames
    }
}
