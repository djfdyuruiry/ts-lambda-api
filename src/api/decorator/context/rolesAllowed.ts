import { DecoratorRegistry } from "../../reflection/DecoratorRegistry";

export function rolesAllowed(...roleNames: string[]) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.rolesAllowed = roleNames
    }
}

export function controllerRolesAllowed(...roleNames: string[]) {
    return (classDefinition: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(classDefinition)

        apiController.rolesAllowed = roleNames
    }
}
