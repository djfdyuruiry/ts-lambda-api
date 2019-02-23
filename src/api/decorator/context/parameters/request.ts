import { RequestParameterExtractor } from "../../../parameters/RequestParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

export function request(classDefinition: Object | Function, methodName: string, paramIndex: number) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.parameterExtractors[paramIndex] = new RequestParameterExtractor()
}
