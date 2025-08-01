import { RequestParameterExtractor } from "../../../parameters/RequestParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

/**
 * Decorator which injects a the current HTTP request context as a parameter value.
 *
 * Value passed to the method will be of type `Request` from the lambda-api package.
 */
export function request(classDefinition: object | Function, methodName: string, paramIndex: number) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.parameterExtractors[paramIndex] = new RequestParameterExtractor()
}
