import { UserParameterExtractor } from "../../../parameters/UserParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

/**
 * Decorator which injects the current authentication principal as a parameter value.
 *
 * Value passed to the method will be an implementation of the `Principal` interface.
 */
export function principal(classDefinition: object | Function, methodName: string, paramIndex: number) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.parameterExtractors[paramIndex] = new UserParameterExtractor()
}
