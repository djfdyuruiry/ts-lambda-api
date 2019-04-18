import * as fs from "fs"

import { LogFactory } from "../../util/logging/LogFactory"

export class ControllerLoader {
    public static async loadControllers(controllersDirectory: string, logFactory: LogFactory) {
        let logger = logFactory.getLogger(ControllerLoader)

        logger.debug("Scanning directory for javascript files: %s", controllersDirectory)

        for (let file of fs.readdirSync(controllersDirectory)) {
            if (file.endsWith(".js")) {
                logger.debug("Importing javascript file: %s", file)

                await import(`${controllersDirectory}/${file}`)
            } else {
                logger.trace("Ignoring non javascript file in controllers directory: %s", file)
            }
        }
    }
}
