import { DecoratorRegistry } from "../DecoratorRegistry";

/**
 * decorators for controller endpoint methods, a path
 * for the endpoint can be specified
 */

export function GET(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "GET")
}

export function POST(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "POST")
}

export function PUT(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "PUT")
}

export function DELETE(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "DELETE")
}

export function PATCH(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "PATCH")
}

function registerApiEndpoint(classDefinition: Object, methodName: string, path: string, httpMethod: string) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.httpMethod = httpMethod
    endpoint.path = path
}
