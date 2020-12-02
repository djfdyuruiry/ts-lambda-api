export class NullFieldsModel {
    public populatedField: number;
    public emptyString: string;
    public nullString: string;

    public static example() {
        let nullFields = new NullFieldsModel()

        nullFields.populatedField = 30;
        nullFields.emptyString = "";
        nullFields.nullString = null;

        return nullFields;
    }
}
