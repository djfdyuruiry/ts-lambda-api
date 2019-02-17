import "reflect-metadata"

import { API } from "lambda-api"
import { Server } from "./api/Server"
import { Container } from "inversify"
import { AppConfig } from "./model/AppConfig"
import { ApiRequest } from "./model/ApiRequest";
import { ApiResponse } from "./model/ApiResponse";

export abstract class ApiApp {
    protected readonly apiServer: Server
    protected readonly appContainer: Container

    public constructor(appConfig?: AppConfig, appContainer?: Container) {
        this.appContainer = appContainer || new Container({ autoBindInjectable: true })
        this.apiServer = new Server(appConfig || new AppConfig())
    }

    /**
     * Configure the IOC container instance. 
     */
    public configureApp(configureBlock: (this: void, container: Container) => void) {
        configureBlock(this.appContainer)
    }

    /**
     * Configure the lambda-api API instance. 
     */
    public configureApi(configureBlock: (this: void, api: API) => void) {
        this.apiServer.configure(configureBlock)
    }

    public abstract async run(event: ApiRequest, context: any): Promise<ApiResponse>;

    protected async initialiseControllers(controllersPath: string) {
        await this.apiServer.discoverAndBuildRoutes(controllersPath, this.appContainer)
    }
}
