import { Location } from "./Location";

export class Person {
    public name: string
    public age: number
    public location?: Location
    public roles?: string[]

    public static example() {
        let person = new Person()

        person.name = "name"
        person.age = 18
        person.location = {
            city: "city",
            country: "country",
            localeCodes: [10, 20, 30]
        }
        person.roles = ["role1", "role2", "roleN"]

        return person
    }

    public toString() {
        return `${this.name} is ${this.age} years old`
    }
}
