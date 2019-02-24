import { Principal } from "../../../../dist/typescript-lambda-api"

export class TestUser extends Principal {
    public constructor(name: string, public readonly roles: string[]) {
        super(name)
    }
}
