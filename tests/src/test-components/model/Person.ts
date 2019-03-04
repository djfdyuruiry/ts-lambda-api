export class Person {
    public name: string
    public age: number

    public static example() {
        let person = new Person()

        person.name = "name"
        person.age = 18

        return person
    }
}
