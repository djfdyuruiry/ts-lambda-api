import { Principal } from "../../../../dist/index"

export class TestUser extends Principal {
    public constructor(name: string, public readonly roles: string[]) {
        super(name)
    }
}
