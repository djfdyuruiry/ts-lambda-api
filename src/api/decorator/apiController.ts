import { DecoratorRegistry } from "../reflection/DecoratorRegistry"

/**
 * Decorator that can be placed on a class to mark it is an API controller.
 *
 * @param path A root URL path that all endpoints in this controller share; optional.
 *             This URL can contain path parameters, prefixed with a colon (':') character.
 */
export function apiController(path?: string) {
    return (constructor: Function) => {
        let controller = DecoratorRegistry.getOrCreateController(constructor)

        DecoratorRegistry.getLogger().debug("@apiController('%s') decorator executed for controller: %s",
            path, controller.name)

        controller.path = path
    }
}
