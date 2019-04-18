import { inspect } from "util"

import { LogLevel } from "../../../model/logging/LogLevel"
import { ApiOperation } from "../../../model/open-api/ApiOperation"
import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator that can be placed on an endpoint to describe it in any generated
 * OpenAPI specification.
 *
 * @param apiOperationInfo Information about this api operation; will be merged with
 *                         existing info if present, replacing any existing properties,
 *                         if provided in this parameter.
 */
export function apiOperation(apiOperationInfo: ApiOperation) {
    return (classDefinition: Object, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        if (DecoratorRegistry.getLogger().level < LogLevel.info) {
            DecoratorRegistry.getLogger().debug("@apiOperation(%s) decorator executed for endpoint: %s",
                inspect(apiOperationInfo),
                endpoint.name)
        }

        endpoint.getOrCreateApiOperationInfo().mergeInfo(apiOperationInfo)
    }
}
