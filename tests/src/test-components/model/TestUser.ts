import { Principal } from "../../../../dist/ts-lambda-api"

export class TestUser extends Principal {
    public constructor(name: string, public readonly roles: string[]) {
        super(name)
    }
}
