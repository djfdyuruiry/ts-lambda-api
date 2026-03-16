import * as fs from "fs"
import path from "path"

import { LogFactory } from "../../util/logging/LogFactory"

export class ControllerLoader {
    private static readonly MODULE_EXTENSIONS = new Set([".js", ".cjs", ".mjs"])

    public static async loadControllers(controllersDirectory: string, logFactory: LogFactory) {
        let logger = logFactory.getLogger(ControllerLoader)

        logger.debug("Scanning directory recursively for controller modules: %s", controllersDirectory)

        for (let file of this.getControllerModulePaths(controllersDirectory, logger)) {
            logger.debug("Importing controller module: %s", file)

            await import(file)
        }
    }

    private static getControllerModulePaths(directory: string, logger: ReturnType<LogFactory["getLogger"]>) {
        let discoveredFiles = new Set<string>()
        this.walkDirectory(directory, logger, discoveredFiles)

        return Array.from(discoveredFiles).sort()
    }

    private static walkDirectory(
        directory: string,
        logger: ReturnType<LogFactory["getLogger"]>,
        discoveredFiles: Set<string>
    ) {
        for (let entry of fs.readdirSync(directory, { withFileTypes: true })) {
            let fullPath = path.resolve(directory, entry.name)

            if (entry.isDirectory()) {
                this.walkDirectory(fullPath, logger, discoveredFiles)
                continue
            }

            if (!entry.isFile()) {
                logger.trace("Ignoring non-file entry in controllers directory: %s", fullPath)
                continue
            }

            if (!this.isControllerModuleFile(entry.name)) {
                logger.trace("Ignoring non controller module file: %s", fullPath)
                continue
            }

            discoveredFiles.add(fullPath)
        }
    }

    private static isControllerModuleFile(fileName: string) {
        if (fileName.endsWith(".d.ts") || fileName.endsWith(".map") || fileName.startsWith(".")) {
            return false
        }

        return this.MODULE_EXTENSIONS.has(path.extname(fileName))
    }
}
