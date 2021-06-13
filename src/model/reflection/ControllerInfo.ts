import { interfaces } from "inversify"

import { EndpointInfo } from "./EndpointInfo"
import { ErrorInterceptor } from "../../api/error/ErrorInterceptor"
import { ApiBodyInfo } from "../open-api/ApiBodyInfo"

export class ControllerInfo {
    public readonly name: string
    public readonly classConstructor: Function

    public apiName?: string
    public apiDescription?: string
    public apiIgnore?: boolean
    public path?: string
    public consumes?: string
    public apiRequestInfo?: ApiBodyInfo
    public produces?: string
    public noAuth?: boolean
    public rolesAllowed?: string[]
    public errorInterceptor?: interfaces.ServiceIdentifier<ErrorInterceptor>
    public endpoints: Map<string, EndpointInfo> = new Map<string, EndpointInfo>()

    public constructor(name: string, classConstructor: Function) {
        this.name = name
        this.classConstructor = classConstructor
    }

    public getOrCreateRequestInfo() {
        if (!this.apiRequestInfo) {
            this.apiRequestInfo = new ApiBodyInfo()
        }

        return this.apiRequestInfo
    }
}
