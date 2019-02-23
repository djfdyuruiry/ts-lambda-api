import { IAuthorizer, Principal } from "../../../index"

import { TestUser } from "./model/TestUser"

export class TestAuthorizer implements IAuthorizer<TestUser> {
    public wasInvoked: boolean
    public principalPassed: Principal
    public rolePassed: string

    public constructor() {
        this.wasInvoked = false
    }

    public async authorize(principal: TestUser, role: string): Promise<boolean> {
        this.wasInvoked = true
        this.principalPassed = principal
        this.rolePassed = role

        return principal.roles.includes(role)
    }
}
