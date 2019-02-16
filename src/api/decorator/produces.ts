export function produces(contentType: string) {
    return (classDefinition: Function) => {
        var classDef: any = classDefinition

        // store contentType against controller/endpoint
        classDef.produces = contentType;
    }
}
