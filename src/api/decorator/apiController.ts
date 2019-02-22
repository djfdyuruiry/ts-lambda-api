import { DecoratorRegistry } from "../reflection/DecoratorRegistry"

export function apiController(path?: string) {
    return (constructor: Function) => {
        let apiController = DecoratorRegistry.getOrCreateController(constructor)

        apiController.path = path
    }
}
