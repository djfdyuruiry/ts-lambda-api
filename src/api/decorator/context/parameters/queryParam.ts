import { QueryParameterExtractor } from "../../../parameters/QueryParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

export function queryParam(paramName: string) {
    return (classDefinition: Object | Function, methodName: string, paramIndex: number) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.parameterExtractors[paramIndex] = new QueryParameterExtractor(paramName)
    }
}
