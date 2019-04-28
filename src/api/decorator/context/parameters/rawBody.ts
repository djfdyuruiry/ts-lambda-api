import { RawBodyParameterExtractor } from "../../../parameters/RawBodyParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

/**
 * Decorator which injects the raw HTTP request body as a parameter value.
 *
 * Value passed to the method will be a Buffer.
 */
export function rawBody(classDefinition: Object | Function, methodName: string, paramIndex: number) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.parameterExtractors[paramIndex] = new RawBodyParameterExtractor()
}
