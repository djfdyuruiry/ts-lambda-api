import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for a controller class to describe it in any generated
 * OpenAPI specification.
 *
 * @param name Name of the API used to categorise endpoints in this controller.
 */
export function apiIgnoreController() {
    return (classDefinition: Function) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition)

        DecoratorRegistry.getLogger().debug("@apiIgnore() decorator executed for controller: %s",
            controller.name)

        controller.apiIgnore = true;
    }
}
