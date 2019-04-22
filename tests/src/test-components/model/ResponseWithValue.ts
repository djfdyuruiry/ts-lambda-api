import { ApiResponse } from "../../../../dist/ts-lambda-api"

export class ResponseWithValue<T> extends ApiResponse {
    public value?: T
}
