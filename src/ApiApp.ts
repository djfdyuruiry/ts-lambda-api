import "reflect-metadata"

import { API } from "lambda-api"
import { ApiServer } from "./api/ApiServer"
import { Container } from "inversify"
import { AppConfig } from "./model/AppConfig"
import { ApiRequest } from "./model/ApiRequest";
import { ApiResponse } from "./model/ApiResponse";

export abstract class ApiApp {
    protected readonly apiServer: ApiServer
    protected readonly appContainer: Container

    public constructor(appConfig?: AppConfig, appContainer?: Container) {
        if (appContainer) {
            this.appContainer = appContainer
        } else {
            this.appContainer = new Container({ autoBindInjectable: true })

            if (appConfig) {
                this.appContainer
                    .bind<AppConfig>(AppConfig)
                    .toConstantValue(new AppConfig())
            }
        }

        this.apiServer = this.appContainer.get<ApiServer>(ApiServer)
    }

    /**
     * Configure the IOC container instance. 
     */
    public configureApp(configureBlock: (appContainer: Container) => void) {
        configureBlock.apply(this.appContainer)
    }

    /**
     * Configure the lambda-api API instance. 
     */
    public configureApi(configureBlock: (api: API) => void) {
        this.apiServer.configure(configureBlock)
    }

    public abstract async run(event: ApiRequest, context: any): Promise<ApiResponse>;

    protected async initialiseControllers(controllersPath: string) {
        await this.apiServer.discoverAndBuildRoutes(controllersPath, this.appContainer)
    }
}
