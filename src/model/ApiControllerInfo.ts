import { ApiEndpointInfo } from "./ApiEndpointInfo";

export class ApiControllerInfo {
    public readonly name: string
    public readonly classConstructor: Function

    public path?: string
    public produces?: string
    public endpoints: Map<string, ApiEndpointInfo> = new Map<string, ApiEndpointInfo>()

    public constructor(name: string, classConstructor: Function) {
        this.name = name
        this.classConstructor = classConstructor
    }
}
