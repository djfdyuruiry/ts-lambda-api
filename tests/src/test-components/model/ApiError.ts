export class ApiError {
    public statusCode: number
    public error: string

    public static example() {
        let error = new ApiError()

        error.statusCode = 500
        error.error = "error description"

        return error
    }

    public toString() {
        return `${this.statusCode}: ${this.error}`
    }
}
