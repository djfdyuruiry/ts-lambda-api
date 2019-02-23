import { Principal } from "../../../../index"

export class TestUser extends Principal {
    public constructor(name: string) {
        super(name)
    }
}
