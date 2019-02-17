import { ApiDecoratorRegistry } from "../ApiDecoratorRegistry"

export function apiController(path?: string) {
    return (constructor: Function) => {
        let apiController = ApiDecoratorRegistry.getOrCreateController(constructor)

        apiController.path = path
    }
}
