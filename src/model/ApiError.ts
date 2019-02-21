import { Request, Response } from "lambda-api"

import { Controller } from "../api/Controller"

export class ApiError {
    public error: any
    public endpointMethodParameters: any[]
    public endpointMethod: Function
    public endpointController: Controller
    public request: Request
    public response: Response
}