import { BodyParameterExtractor } from "../../../parameters/BodyParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

/**
 * Decorator which injects the HTTP request body as a parameter value.
 *
 * Value passed to the method will be an object, array or primitive value
 * if the request body is JSON, otherwise it will be a string.
 */
export function body(classDefinition: object | Function, methodName: string, paramIndex: number) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.parameterExtractors[paramIndex] = new BodyParameterExtractor()
}
