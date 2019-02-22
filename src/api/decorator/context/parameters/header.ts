import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"
import { HeaderParameterExtractor } from "../../../parameters/HeaderParameterExtractor"

export function header(headerName?: string) {
    return (classDefinition: Object | Function, methodName: string, paramIndex: number) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.parameterExtractors[paramIndex] = new HeaderParameterExtractor(headerName)
    }
}
