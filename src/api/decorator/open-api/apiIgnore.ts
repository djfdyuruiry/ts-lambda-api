import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator that can be placed on an endpoint method to exclude it from any generated
 * OpenAPI specification.
 */
export function apiIgnore() {
    return (classDefinition: Object, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        if (DecoratorRegistry.getLogger().debugEnabled()) {
            DecoratorRegistry.getLogger().debug("@apiIgnore() decorator executed for endpoint: %s",
                endpoint.name)
        }

        endpoint.apiIgnore = true;
    }
}
