import { IAuthorizer, Principal } from "../../../dist/ts-lambda-api"

import { TestUser } from "./model/TestUser"

export class TestAuthorizer implements IAuthorizer<TestUser> {
    public readonly name: string = TestAuthorizer.name

    public wasInvoked: boolean
    public principalPassed: Principal
    public rolePassed: string

    public constructor(private readonly throwError: boolean = false) {
        this.wasInvoked = false
    }

    public async authorize(principal: TestUser, role: string): Promise<boolean> {
        this.wasInvoked = true
        this.principalPassed = principal
        this.rolePassed = role

        if (this.throwError) {
            throw new Error("Uh oh spaghettios!")
        }

        return principal.roles.includes(role)
    }
}
