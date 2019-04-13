import { Request } from "lambda-api"

import { IAuthFilter, apiSecurity } from "../../../dist/typescript-lambda-api"

import { TestUser } from "./model/TestUser"

@apiSecurity("bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
})
export class TestCustomAuthFilter implements IAuthFilter<string, TestUser> {
    public readonly authenticationSchemeName: string = "Bearer"

    public wasInvoked: boolean
    public passedCredentials: string

    public constructor(
        private readonly username: string,
        private readonly shouldThrowError: boolean = false,
        private readonly roles: string[] = []
    ) {
        this.wasInvoked = false
    }

    public async extractAuthData(request: Request) {
        let authHeader = request.headers["Authorization"]

        if (
            authHeader && (authHeader.length > 7) &&
            authHeader.toLowerCase().startsWith("bearer ")
        ) {
            return authHeader.substr(6)
        }
    }

    public async authenticate(jwtToken: string) {
        this.wasInvoked = true
        this.passedCredentials = jwtToken

        if (this.shouldThrowError) {
            throw Error("authenticate failed")
        }

        if (jwtToken === "__token__") {
            return new TestUser(this.username, this.roles)
        }
    }
}
