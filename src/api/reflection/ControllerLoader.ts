import * as fs from "fs"

export class ControllerLoader {
    public static async loadControllers(controllersDirectory: string) {
        for (let file of fs.readdirSync(controllersDirectory)) {
            if (file.endsWith(".js")) {
                await import(`${controllersDirectory}/${file}`)
            }
        }
    }
}
