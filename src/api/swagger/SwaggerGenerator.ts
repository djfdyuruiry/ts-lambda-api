import { OpenApiBuilder, OpenAPIObject } from "openapi3-ts"

import { DecoratorRegistry } from "../reflection/DecoratorRegistry"

export type SwaggerFormat = "json" | "yml" | "object"

export function buildApiSwaggerSpec(format: SwaggerFormat): string | OpenAPIObject {
    let endpoints = DecoratorRegistry.Endpoints
    let openApiBuilder = OpenApiBuilder.create()

    for (let endpoint in endpoints) {
        if (!endpoints.hasOwnProperty(endpoint)) {
            continue
        }

        let endpointInfo = endpoints[endpoint]
        let pathInfo = {}

        pathInfo[endpointInfo.httpMethod.toLowerCase()] = {}

        openApiBuilder = openApiBuilder.addPath(endpointInfo.fullPath, pathInfo)
    }

    if (format === "json") {
        return openApiBuilder.getSpecAsJson()
    } else if (format === "yml") {
        return openApiBuilder.getSpecAsYaml()
    }

    return openApiBuilder.getSpec()
}
