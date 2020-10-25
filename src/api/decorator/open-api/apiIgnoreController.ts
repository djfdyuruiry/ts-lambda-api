import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for a controller class to exclude it from any generated
 * OpenAPI specification.
 */
export function apiIgnoreController() {
    return (classDefinition: Function) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition)

        DecoratorRegistry.getLogger().debug("@apiIgnoreController() decorator executed for controller: %s",
            controller.name)

        controller.apiIgnore = true;
    }
}
