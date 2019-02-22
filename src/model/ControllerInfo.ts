import { interfaces } from "inversify/dts/interfaces/interfaces"

import { EndpointInfo } from "./EndpointInfo"
import { ErrorInterceptor } from "../api/ErrorInterceptor"

export class ControllerInfo {
    public readonly name: string
    public readonly classConstructor: Function

    public path?: string
    public produces?: string
    public errorInterceptor?: interfaces.ServiceIdentifier<ErrorInterceptor>
    public endpoints: Map<string, EndpointInfo> = new Map<string, EndpointInfo>()

    public constructor(name: string, classConstructor: Function) {
        this.name = name
        this.classConstructor = classConstructor
    }
}
