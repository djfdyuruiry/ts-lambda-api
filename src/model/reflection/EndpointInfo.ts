import { interfaces } from "inversify/dts/interfaces/interfaces"

import { ControllerInfo } from "./ControllerInfo"
import { ErrorInterceptor } from "../../api/error/ErrorInterceptor"
import { IParameterExtractor } from "../../api/parameters/IParameterExtractor"
import { ApiOperationInfo } from "../open-api/ApiOperationInfo"
import { ApiBodyInfo } from "../open-api/ApiBodyInfo";

export class EndpointInfo {
    public readonly controller?: ControllerInfo
    public readonly method: Function
    public readonly parameterExtractors: IParameterExtractor[]
    public httpMethod: string
    public path?: string
    public consumes?: string
    public produces?: string
    public noAuth?: boolean
    public rolesAllowed?: string[]
    public errorInterceptor?: interfaces.ServiceIdentifier<ErrorInterceptor>
    public apiOperationInfo?: ApiOperationInfo
    public apiIgnore?: boolean;

    public get fullPath() {
        let rootPath = this.getControllerPropOrDefault(c => c.path) || ""
        let endpointPath = this.path || ""

        return `${rootPath}${endpointPath}`
    }

    public get requestContentType() {
        return this.consumes || this.getControllerPropOrDefault(c => c.consumes)
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

    public get apiRequestInfo() {
        let request: ApiBodyInfo

        if (this.apiOperationInfo) {
            request = this.apiOperationInfo.request
        }

        return request ||
            this.getControllerPropOrDefault(c => c.apiRequestInfo)
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

            if (controllerOrMethod.name && controllerOrMethod.name.trim() !== "") {
                this.methodName = controllerOrMethod.name
            } else {
                this.methodName = this.name
            }
        }

        this.parameterExtractors = Array(this.method.length)
    }

    public getControllerPropOrDefault<T>(lookup: (c: ControllerInfo) => T, defaultValue?: T) {
        return this.controller ? lookup(this.controller) : defaultValue
    }

    public getOrCreateApiOperationInfo() {
        if (!this.apiOperationInfo) {
            this.apiOperationInfo = new ApiOperationInfo()
        }

        return this.apiOperationInfo
    }
}
