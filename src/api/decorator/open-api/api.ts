import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for a controller class to describe it in any generated
 * OpenAPI specification.
 *
 * @param name Name of the API used to categorise endpoints in this controller.
 */
export function api(name: string, description?: string) {
    return (classDefinition: Function) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition)

        DecoratorRegistry.getLogger().debug("@api('%s'%s) decorator executed for controller: %s",
            name,
            description ? `, '${description}'` : "",
            controller.name)

        controller.apiName = name
        controller.apiDescription = description
    }
}
