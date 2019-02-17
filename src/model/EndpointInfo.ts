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
        this.parameterExtractors = Array(this.method.length)
    }
}
