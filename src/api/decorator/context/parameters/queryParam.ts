import { ApiParam } from "../../../../model/open-api/ApiParam"
import { QueryParameterExtractor } from "../../../parameters/QueryParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

/**
 * Decorator which injects a query parameter value as an endpoint parameter value.
 *
 * Value passed to the method will be a string.
 *
 * @param paramName The name of the query parameter to inject.
 */
export function queryParam(paramName: string, apiParamInfo?: ApiParam) {
    return (classDefinition: object | Function, methodName: string, paramIndex: number) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.parameterExtractors[paramIndex] = new QueryParameterExtractor(paramName, apiParamInfo)
    }
}
