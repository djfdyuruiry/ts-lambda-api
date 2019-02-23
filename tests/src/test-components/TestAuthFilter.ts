import { AuthenticationError, BasicAuthFilter, BasicAuth } from "../../../index"

import { TestUser } from "./model/TestUser";

export class TestAuthFilter extends BasicAuthFilter<TestUser> {
    public wasInvoked: boolean
    public passedCredentials: BasicAuth

    public constructor(private readonly username: string,
        private readonly password: string,
        private readonly shouldThrowError: boolean = false) {
            super()

            this.wasInvoked = false
        }

    public async authenticate(basicAuth: BasicAuth) {
        this.wasInvoked = true
        this.passedCredentials = basicAuth

        if (this.shouldThrowError) {
            throw Error("authenticate failed")
        }

        if (basicAuth.username !== this.username || basicAuth.password !== this.password) {
            throw new AuthenticationError()
        }

        return new TestUser(basicAuth.username)
    }
}
