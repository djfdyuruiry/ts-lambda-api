import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator that can be placed on an endpoint to describe it in any generated
 * OpenAPI specification.
 *
 * @param apiOperationInfo Information about this api operation; will be merged with
 *                         existing info if present, replacing any existing properties,
 *                         if provided in this parameter.
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
