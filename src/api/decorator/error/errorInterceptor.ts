import { interfaces } from "inversify/dts/interfaces/interfaces"

import { ErrorInterceptor } from "../../error/ErrorInterceptor"
import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

export function errorInterceptor(interceptor: interfaces.ServiceIdentifier<ErrorInterceptor>) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        endpoint.errorInterceptor = interceptor
    }
}

export function controllerErrorInterceptor(interceptor: interfaces.ServiceIdentifier<ErrorInterceptor>) {
    return (classDefinition: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(classDefinition)

        apiController.errorInterceptor = interceptor
    }
}
