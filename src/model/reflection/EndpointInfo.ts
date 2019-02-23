import { interfaces } from "inversify/dts/interfaces/interfaces"

import { ControllerInfo } from "./ControllerInfo"
import { ErrorInterceptor } from "../../api/error/ErrorInterceptor"
import { IParameterExtractor } from "../../api/parameters/IParameterExtractor"

export class EndpointInfo {
    public readonly method: Function
    public readonly parameterExtractors: IParameterExtractor[]
    public httpMethod: string
    public path?: string
    public produces?: string
    public rolesAllowed?: string[]
    public errorInterceptor?: interfaces.ServiceIdentifier<ErrorInterceptor>

    public constructor(
        public readonly name: string,
        public readonly controller: ControllerInfo,
        public readonly methodName: string
    ) {
        this.method = this.controller.classConstructor.prototype[methodName]

        if (this.method === undefined) {
            throw new Error(
                `Unable to read method parameters for endpoint '${this.methodName}' in controller '${controller.name}', ` +
                "this normally happens when you have two controllers with the same class name"
            )
        }

        this.parameterExtractors = Array(this.method.length)
    }
}
