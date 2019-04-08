export class EdgeCaseModel {
    public invalidArray: Function[]
    public arrayOfObjects: Object[]
    public arrayOfArrays: Object[]

    public static example() {
        let edgeCaseModel = new EdgeCaseModel()

        edgeCaseModel.invalidArray = [
            () => {
            },
            () => {
            }
        ]

        edgeCaseModel.arrayOfObjects = [
            {
                field1: "field1",
                field2: 2,
                field3: [1, 2, 3]
            },
            {
                field1: "field1",
                field2: 2,
                field3: [1, 2, 3]
            }
        ]

        edgeCaseModel.arrayOfArrays = [
            ["a", "b", "c"],
            ["a", "b", "c"]
        ]

        return edgeCaseModel
    }
}
