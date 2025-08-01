import { ApiParam } from "../../../../model/open-api/ApiParam"
import { HeaderParameterExtractor } from "../../../parameters/HeaderParameterExtractor"
import { DecoratorRegistry } from "../../../reflection/DecoratorRegistry"

/**
 * Decorator which injects a HTTP request header as a parameter value.
 *
 * Value passed to the method will be a string.
 *
 * @param headerName The name of the header to inject.
 */
export function header(headerName: string, apiParamInfo?: ApiParam) {
    return (classDefinition: object | Function, methodName: string, paramIndex: number) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.parameterExtractors[paramIndex] = new HeaderParameterExtractor(headerName, apiParamInfo)
    }
}
