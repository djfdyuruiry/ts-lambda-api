import { Person } from "./Person"

export class People {
    public static example() {
        return [
            Person.example(),
            Person.example(),
            Person.example()
        ]
    }
}
