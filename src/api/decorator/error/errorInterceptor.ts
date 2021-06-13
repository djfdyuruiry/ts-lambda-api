import { inspect } from "util"

import { interfaces } from "inversify"

import { LogLevel } from "../../../model/logging/LogLevel"
import { ErrorInterceptor } from "../../error/ErrorInterceptor"
import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for an endpoint method that configures the type to use to intercept errors.
 *
 * Overrides the controller error interceptor set by the `controllerErrorInterceptor` decorator, if any.
 *
 * Error interceptors instances are built using the InversifyJS IOC container for the current app.
 */
export function errorInterceptor(interceptor: interfaces.ServiceIdentifier<ErrorInterceptor>) {
    return (classDefinition: Object | Function, methodName: string) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition.constructor)
        let endpoint = DecoratorRegistry.getOrCreateEndpoint(controller, methodName)

        if (DecoratorRegistry.getLogger().debugEnabled()) {
            DecoratorRegistry.getLogger().debug("@errorInterceptor(%s) decorator executed for endpoint: %s",
                inspect(interceptor),
                endpoint.name)
        }

        endpoint.errorInterceptor = interceptor
    }
}

/**
 * Decorator for a controller class that configures the type to use to intercept errors.
 *
 * Error interceptors instances are built using the current app InversifyJS IOC container.
 */
export function controllerErrorInterceptor(interceptor: interfaces.ServiceIdentifier<ErrorInterceptor>) {
    return (classDefinition: Function) => {
        let controller = DecoratorRegistry.getOrCreateController(classDefinition)

        if (DecoratorRegistry.getLogger().debugEnabled()) {
            DecoratorRegistry.getLogger().debug("@controllerErrorInterceptor(%s) decorator executed for controller: %s",
                inspect(interceptor),
                controller.name)
        }

        controller.errorInterceptor = interceptor
    }
}
