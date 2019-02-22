import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"
import { BodyParameterExtractor } from "../../../parameters/BodyParameterExtractor"

export function fromBody(classDefinition: Object | Function, methodName: string, paramIndex: number) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.parameterExtractors[paramIndex] = new BodyParameterExtractor()
}
