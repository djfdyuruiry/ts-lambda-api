import { DecoratorRegistry } from "../DecoratorRegistry";
import { QueryParameterExtractor } from "../parameters/QueryParameterExtractor";

export function queryParam(paramName: string) {
    return (classDefinition: Object | Function, methodName: string, paramIndex: number) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.parameterExtractors[paramIndex] = new QueryParameterExtractor(paramName);
    }
}
