import { AuthFilterInfo } from "../../model/open-api/AuthFilterInfo"
import { ControllerInfo } from "../../model/reflection/ControllerInfo"
import { EndpointInfo } from "../../model/reflection/EndpointInfo"
import { IDictionary } from "../../util/IDictionary"
import { ILogger } from "../../util/logging/ILogger"
import { LogFactory } from "../../util/logging/LogFactory"

export class DecoratorRegistry {
    private static logger: ILogger = LogFactory.getDefaultLogger(DecoratorRegistry)

    // these are required to be dictionaries, using Map here causes weird issues with persistance
    public static readonly Endpoints: IDictionary<EndpointInfo> = {}
    public static readonly Controllers: IDictionary<ControllerInfo> = {}
    public static readonly AuthFilters: IDictionary<AuthFilterInfo> = {}

    public static getLogger() {
        return DecoratorRegistry.logger
    }

    public static setLogger(logFactory: LogFactory) {
        DecoratorRegistry.logger = logFactory.getLogger(DecoratorRegistry)
    }

    public static getOrCreateController(constructor: Function): ControllerInfo {
        let name = constructor.name

        if (!DecoratorRegistry.Controllers[name]) {
            DecoratorRegistry.logger.debug("Controller registered: %s", name)

            DecoratorRegistry.Controllers[name] = new ControllerInfo(name, constructor)
        }

        return DecoratorRegistry.Controllers[name]
    }

    public static getOrCreateEndpoint(controller: ControllerInfo, methodName: string): EndpointInfo {
        let endpointKey = `${controller.name}::${methodName}`

        if (!DecoratorRegistry.Endpoints[endpointKey]) {
            DecoratorRegistry.logger.debug("Endpoint registered: %s", endpointKey)

            DecoratorRegistry.Endpoints[endpointKey] = new EndpointInfo(endpointKey, controller, methodName)
        }

        controller.endpoints[methodName] = DecoratorRegistry.Endpoints[endpointKey]

        return DecoratorRegistry.Endpoints[endpointKey]
    }

    public static getOrCreateAuthFilter(constructor: Function) {
        let name = constructor.name

        if (!DecoratorRegistry.AuthFilters[name]) {
            DecoratorRegistry.logger.debug("Authenticaion filter registered: %s", name)

            DecoratorRegistry.AuthFilters[name] = new AuthFilterInfo()
        }

        return DecoratorRegistry.AuthFilters[name]
    }
}
