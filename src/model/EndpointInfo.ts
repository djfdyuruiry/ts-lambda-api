import { ControllerInfo } from "./ControllerInfo";
import { IParameterExtractor } from "../api/parameters/IParameterExtractor";

export class EndpointInfo {
    public readonly method: Function
    public readonly parameterExtractors: IParameterExtractor[]
    public httpMethod: string
    public path?: string
    public produces?: string

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
