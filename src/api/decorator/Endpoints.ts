import { API, METHODS } from "lambda-api";

import { ApiDecoratorRegistry } from "../ApiDecoratorRegistry";

/**
 * decorators for controller endpoint methods, a path
 * for the endpoint can be specified
 */

export function GET(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "GET")
}

export function POST(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "POST")
}

export function PUT(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "PUT")
}

export function DELETE(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "DELETE")
}

export function PATCH(path: string = "") {
    return (classDefinition: Object, methodName: string) => 
        registerApiEndpoint(classDefinition, methodName, path, "PATCH")
}

function registerApiEndpoint(classDefinition: Object, methodName: string, path: string, httpMethod: METHODS) {
    ApiDecoratorRegistry.Endpoints.push(
        (api: API, controllerFactory: (constructor: Function) => any) => {
            let controllerDefintion: any = classDefinition.constructor
            let endpointPath = controllerDefintion.rootPath ? 
                `${controllerDefintion.rootPath}${path}` :
                path

            let call = mapHttpMethodToCall(api, httpMethod)

            // call api setup method, passing in handler that will invoke 
            // the endpoint method on the controller instance with request 
            // and response objects
            call(endpointPath, (req, res) => {
                // build a instance of the associated controller
                let controller = controllerFactory(classDefinition.constructor)

                controller[methodName](req, res)
            })
        }
    )
}

function mapHttpMethodToCall(api: API, method: METHODS) {
    if (method == "GET") {
        return api.get
    } else if (method == "POST") {
        return api.post
    } else if (method == "PUT") {
        return api.put
    } else if (method == "PATCH") {
        return api.patch
    } else if (method == "DELETE") {
        return api.delete
    }

    throw "Unrecognised HTTP method '" + method + "'"
}
