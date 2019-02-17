import { ControllerInfo } from "./ControllerInfo";

export class EndpointInfo {
    public readonly name: string
    public readonly controller: ControllerInfo
    public readonly methodName: string

    public httpMethod: string
    public path?: string
    public produces?: string

    public constructor(name: string, controller: ControllerInfo, methodName: string) {
        this.name = name
        this.controller = controller
        this.methodName = methodName
    }
}
