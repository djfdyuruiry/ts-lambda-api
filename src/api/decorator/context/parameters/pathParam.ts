import { ApiParam } from "../../../../model/open-api/ApiParam"
import { PathParameterExtractor } from "../../../parameters/PathParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

/**
 * Decorator which injects a path parameter value as an endpoint parameter value.
 *
 * Value passed to the method will be a string.
 *
 * @param paramName The name of the path parameter to inject.
 * @param apiParamInfo (Optional) OpenApi metadata about the path parameter.
 */
export function pathParam(paramName: string, apiParamInfo?: ApiParam) {
    return (classDefinition: object | Function, methodName: string, paramIndex: number) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.parameterExtractors[paramIndex] = new PathParameterExtractor(paramName, apiParamInfo)
    }
}
