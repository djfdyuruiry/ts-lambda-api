import { ResponseParameterExtractor } from "../../../parameters/ResponseParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

/**
 * Decorator which injects a the current HTTP response context as a parameter value.
 *
 * Value passed to the method will be of type `Response` from the lambda-api package.
 */
export function response(classDefinition: Object | Function, methodName: string, paramIndex: number) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.parameterExtractors[paramIndex] = new ResponseParameterExtractor()
}
