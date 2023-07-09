import { DecoratorRegistry } from "../reflection/DecoratorRegistry"

/**
 * Decorator that can be placed on a method to mark it is an API endpoint
 * that responds to HTTP GET requests.
 *
 * @param path The URL path that triggers this endpoint; optional if you set a root path on the
 *             class using a `apiController` decorator. This URL can contain path parameters,
 *             prefixed with a colon (':') character.
 */
export function GET(path = "") {
    return (classDefinition: Object, methodName: string) =>
        registerApiEndpoint(classDefinition, methodName, path, "GET")
}

/**
 * Decorator that can be placed on a method to mark it is an API endpoint
 * that responds to HTTP POST requests.
 *
 * @param path The URL path that triggers this endpoint; optional if you set a root path on
 *             the class using a `apiController` decorator. This URL can contain path parameters,
 *             prefixed with a colon (':') character.
 */
export function POST(path = "") {
    return (classDefinition: Object, methodName: string) =>
        registerApiEndpoint(classDefinition, methodName, path, "POST")
}

/**
 * Decorator that can be placed on a method to mark it is an API endpoint
 * that responds to HTTP PUT requests.
 *
 * @param path The URL path that triggers this endpoint; optional if you set a root path on
 *             the class using a `apiController` decorator. This URL can contain path parameters,
 *             prefixed with a colon (':') character.
 */
export function PUT(path = "") {
    return (classDefinition: Object, methodName: string) =>
        registerApiEndpoint(classDefinition, methodName, path, "PUT")
}

/**
 * Decorator that can be placed on a method to mark it is an API endpoint
 * that responds to HTTP DELETE requests.
 *
 * @param path The URL path that triggers this endpoint; optional if you set a root path on
 *             the class using a `apiController` decorator. This URL can contain path parameters,
 *             prefixed with a colon (':') character.
 */
export function DELETE(path = "") {
    return (classDefinition: Object, methodName: string) =>
        registerApiEndpoint(classDefinition, methodName, path, "DELETE")
}

/**
 * Decorator that can be placed on a method to mark it is an API endpoint
 * that responds to HTTP PATCH requests.
 *
 * @param path The URL path that triggers this endpoint; optional if you set a root path on
 *             the class using a `apiController` decorator. This URL can contain path parameters,
 *             prefixed with a colon (':') character.
 */
export function PATCH(path = "") {
    return (classDefinition: Object, methodName: string) =>
        registerApiEndpoint(classDefinition, methodName, path, "PATCH")
}

function registerApiEndpoint(classDefinition: Object, methodName: string, path: string, httpMethod: string) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    DecoratorRegistry.getLogger().debug("@%s(%s) decorator executed for endpoint: %s",
        httpMethod,
        path.trim() === "" ? "" : `'${path}'`,
        endpoint.name)

    endpoint.httpMethod = httpMethod
    endpoint.path = path
}
