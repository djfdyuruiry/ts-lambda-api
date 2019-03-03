import { ApiResponse } from "../../../../dist/typescript-lambda-api"

export class ResponseWithValue<T> extends ApiResponse{
    public value?: T
}
