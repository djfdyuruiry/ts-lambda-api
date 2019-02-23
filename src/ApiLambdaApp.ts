import { Container } from "inversify"

import { ApiApp } from "./ApiApp"
import { AppConfig } from "./model/AppConfig"
import { ApiRequest } from "./model/ApiRequest"
import { timed } from "./util/timed"

export class ApiLambdaApp extends ApiApp {
    private readonly controllersPath: string

    public constructor(controllersPath: string, appConfig?: AppConfig, appContainer?: Container) {
        super(appConfig, appContainer)

        this.controllersPath = controllersPath
    }

    @timed
    public async run(event: ApiRequest, context: any) {
        await super.initialiseControllers(this.controllersPath)

        return await this.apiServer.processEvent(event, context)
    }
}
