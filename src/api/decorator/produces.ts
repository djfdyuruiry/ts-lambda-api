import { ApiDecoratorRegistry } from "../ApiDecoratorRegistry";

export function produces(contentType: string) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = ApiDecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = ApiDecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.produces = contentType;
    }
}

export function controllerProduces(contentType: string) {
    return (classDefinition: Function) => {
        let apiController = ApiDecoratorRegistry.getOrCreateController(classDefinition)

        apiController.produces = contentType;
    }
}
