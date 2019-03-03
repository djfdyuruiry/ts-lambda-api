import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for a controller class to describe it in any generated
 * OpenAPI specification.
 *
 * @param name Name of the API used to categorise endpoints in this controller.
 */
export function api(name: string) {
    return (classDefinition: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(classDefinition)

        apiController.apiName = name
    }
}
