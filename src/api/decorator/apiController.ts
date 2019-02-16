import { ApiDecoratorRegistry } from "../ApiDecoratorRegistry"

export function apiController(path: string) {
    return (classDefinition: Function) => {
        var classDef: any = classDefinition

        // store rootPath against controller for lookup
        // by an API endpoint decorator
        classDef.rootPath = path;

        ApiDecoratorRegistry.Controllers.push(classDefinition)
    }
}
