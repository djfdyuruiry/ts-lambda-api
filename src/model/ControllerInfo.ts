import { EndpointInfo } from "./EndpointInfo";

export class ControllerInfo {
    public readonly name: string
    public readonly classConstructor: Function

    public path?: string
    public produces?: string
    public endpoints: Map<string, EndpointInfo> = new Map<string, EndpointInfo>()

    public constructor(name: string, classConstructor: Function) {
        this.name = name
        this.classConstructor = classConstructor
    }
}
