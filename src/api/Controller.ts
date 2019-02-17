import { injectable } from "inversify"
import { Request, Response } from "lambda-api"

@injectable()
export abstract class Controller {
    protected request: Request
    protected response: Response

    public setRequest(request: Request) {
        this.request = request
    }

    public setResponse(response: Response) {
        this.response = response
    }

    public async invoke(methodName: string, request: Request, response: Response) {
        let self: any = this

        return await self[methodName](request, response)
    }
}
