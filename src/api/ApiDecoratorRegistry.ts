import { ApiControllerInfo } from "../model/ApiControllerInfo"
import { ApiEndpointInfo } from "../model/ApiEndpointInfo"

/**
 * All controllers and endpoints that declare decorators are registered here.
 * 
 * Each endpoint can be loaded into an API instance by invoking it with the desired API
 * instance and a method that can build the controller, given the contrustor of the class; this
 * allows for dependecy injection to be preformed by an IOC container.
 */
export class ApiDecoratorRegistry {
    // these are required to be dictionaries, using Map here causes weird issues with persistance
    public static readonly Endpoints: { [key: string] : ApiEndpointInfo} = {}
    public static readonly Controllers: { [key: string]: ApiControllerInfo } = {}

    public static getOrCreateController(constructor: Function): ApiControllerInfo {
        let name = constructor.name

        if (!ApiDecoratorRegistry.Controllers[name]) {
            ApiDecoratorRegistry.Controllers[name] = new ApiControllerInfo(name, constructor)
        }

        return ApiDecoratorRegistry.Controllers[name]
    }

    public static getOrCreateEndpoint(controller: ApiControllerInfo, methodName: string): ApiEndpointInfo {
        let endpointKey = `${controller.name}::${methodName}`

        if (!ApiDecoratorRegistry.Endpoints[endpointKey]) {
            ApiDecoratorRegistry.Endpoints[endpointKey] = new ApiEndpointInfo(endpointKey, controller, methodName)
        }

        return ApiDecoratorRegistry.Endpoints[endpointKey]
    }
}
