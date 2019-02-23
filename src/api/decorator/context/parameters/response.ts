import { ResponseParameterExtractor } from "../../../parameters/ResponseParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

export function response(classDefinition: Object | Function, methodName: string, paramIndex: number) {
    let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
    let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

    endpoint.parameterExtractors[paramIndex] = new ResponseParameterExtractor()
}
