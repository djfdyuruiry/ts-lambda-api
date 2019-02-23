import { Principal } from "../../../../index"

export class TestUser extends Principal {
    public constructor(name: string, public readonly roles: string[]) {
        super(name)
    }
}
