import * as fs from "fs"

import { LogFactory } from "../../util/logging/LogFactory"

export class ControllerLoader {
    public static async loadControllers(controllersDirectory: string, logFactory: LogFactory) {
        let logger = logFactory.getLogger(ControllerLoader)

        for (let file of fs.readdirSync(controllersDirectory)) {
            if (file.endsWith(".js")) {
                await import(`${controllersDirectory}/${file}`)
            }
        }
    }
}
