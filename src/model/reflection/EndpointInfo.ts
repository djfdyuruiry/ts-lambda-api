import { interfaces } from "inversify/dts/interfaces/interfaces"

import { ControllerInfo } from "./ControllerInfo"
import { ErrorInterceptor } from "../../api/error/ErrorInterceptor"
import { IParameterExtractor } from "../../api/parameters/IParameterExtractor"

export class EndpointInfo {
    public readonly controller?: ControllerInfo
    public readonly method: Function
    public readonly parameterExtractors: IParameterExtractor[]
    public httpMethod: string
    public path?: string
    public produces?: string
    public noAuth?: boolean
    public rolesAllowed?: string[]
    public errorInterceptor?: interfaces.ServiceIdentifier<ErrorInterceptor>

    public get fullPath() {
        let rootPath = this.getControllerPropOrDefault(c => c.path) || ""
        let endpointPath = this.path || ""

        return `${rootPath}${endpointPath}`
    }

    public get responseContentType() {
        return this.produces || this.getControllerPropOrDefault(c => c.produces)
    }

    public get authenticationDisabled() {
        return this.noAuth || this.getControllerPropOrDefault(c => c.noAuth)
    }

    public get roles() {
        let controllerRoles = this.getControllerPropOrDefault(c => c.rolesAllowed) || []
        let endpointRoles = this.rolesAllowed || []

        return endpointRoles.concat(controllerRoles)
    }

    public get endpointErrorInterceptor() {
        return this.errorInterceptor || this.getControllerPropOrDefault(c => c.errorInterceptor )
    }

    public constructor(
        public readonly name: string,
        controllerOrMethod?: ControllerInfo | Function,
        public readonly methodName?: string,
    ) {
        if (controllerOrMethod instanceof ControllerInfo) {
            this.controller = controllerOrMethod

            this.method = this.controller.classConstructor.prototype[methodName]

            if (this.method === undefined) {
                throw new Error(
                    `Unable to read method parameters for endpoint '${this.methodName}' ` +
                    `in controller '${this.controller.name}', this normally happens when ` +
                    "you have two controllers with the same class name"
                )
            }
        } else {
            this.method = controllerOrMethod
            this.methodName = controllerOrMethod.name
        }

        this.parameterExtractors = Array(this.method.length)
    }

    public getControllerPropOrDefault<T>(lookup: (c: ControllerInfo) => T, defaultValue?: T) {
        return this.controller ? lookup(this.controller) : defaultValue
    }
}
