import { DecoratorRegistry } from "../DecoratorRegistry";

export function produces(contentType: string) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.produces = contentType;
    }
}

export function controllerProduces(contentType: string) {
    return (classDefinition: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(classDefinition)

        apiController.produces = contentType;
    }
}
