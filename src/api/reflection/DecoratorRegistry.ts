import { ControllerInfo } from "../../model/reflection/ControllerInfo"
import { EndpointInfo } from "../../model/reflection/EndpointInfo"

export class DecoratorRegistry {
    // these are required to be dictionaries, using Map here causes weird issues with persistance
    public static readonly Endpoints: { [key: string] : EndpointInfo} = {}
    public static readonly Controllers: { [key: string]: ControllerInfo } = {}

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
}
