import { AuthFilterInfo } from "../../model/open-api/AuthFilterInfo"
import { ControllerInfo } from "../../model/reflection/ControllerInfo"
import { EndpointInfo } from "../../model/reflection/EndpointInfo"
import { IDictionary } from "../../util/IDictionary"

export class DecoratorRegistry {
    // these are required to be dictionaries, using Map here causes weird issues with persistance
    public static readonly Endpoints: IDictionary<EndpointInfo> = {}
    public static readonly Controllers: IDictionary<ControllerInfo> = {}
    public static readonly AuthFilters: IDictionary<AuthFilterInfo> = {}

    public static getOrCreateController(constructor: Function): ControllerInfo {
        let name = constructor.name

        if (!DecoratorRegistry.Controllers[name]) {
            DecoratorRegistry.Controllers[name] = new ControllerInfo(name, constructor)
        }

        return DecoratorRegistry.Controllers[name]
    }

    public static getOrCreateEndpoint(controller: ControllerInfo, methodName: string): EndpointInfo {
        let endpointKey = `${controller.name}::${methodName}`

        if (!DecoratorRegistry.Endpoints[endpointKey]) {
            DecoratorRegistry.Endpoints[endpointKey] = new EndpointInfo(endpointKey, controller, methodName)
        }

        controller.endpoints[methodName] = DecoratorRegistry.Endpoints[endpointKey]

        return DecoratorRegistry.Endpoints[endpointKey]
    }

    public static getOrCreateAuthFilter(constructor: Function) {
        let name = constructor.name

        if (!DecoratorRegistry.AuthFilters[name]) {
            DecoratorRegistry.AuthFilters[name] = new AuthFilterInfo()
        }

        return DecoratorRegistry.AuthFilters[name]
    }
}
