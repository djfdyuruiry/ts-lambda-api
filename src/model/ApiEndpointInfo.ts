import { ApiControllerInfo } from "./ApiControllerInfo";

export class ApiEndpointInfo {
    public readonly name: string
    public readonly controller: ApiControllerInfo
    public readonly methodName: string

    public httpMethod: string
    public path?: string
    public produces?: string

    public constructor(name: string, controller: ApiControllerInfo, methodName: string) {
        this.name = name
        this.controller = controller
        this.methodName = methodName
    }
}
