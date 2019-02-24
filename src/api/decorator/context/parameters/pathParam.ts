import { PathParameterExtractor } from "../../../parameters/PathParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

/**
 * Decorator which injects a path parameter value as an endpoint parameter value.
 *
 * Value passed to the method will be a string.
 *
 * @param paramName The name of the path parameter to inject.
 */
export function pathParam(paramName: string) {
    return (classDefinition: Object | Function, methodName: string, paramIndex: number) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.parameterExtractors[paramIndex] = new PathParameterExtractor(paramName)
    }
}
