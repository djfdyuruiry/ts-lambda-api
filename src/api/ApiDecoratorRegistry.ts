import { API } from "lambda-api";

/**
 * All controllers and endpoints that declare decorators are registered here.
 * 
 * Each endpoint can be loaded into an API instance by invoking it with the desired API
 * instance and a method that can build the controller, given the contrustor of the class; this
 * allows for dependecy injection to be preformed by an IOC container.
 */
export class ApiDecoratorRegistry {
    public static readonly Endpoints: 
        ((api: API, controllerFactory: (constructor: Function) => any) => void)[] = []
    public static readonly Controllers: Object[] = []
}
