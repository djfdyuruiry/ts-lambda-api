import { OpenApiBuilder } from "openapi3-ts"

import { DecoratorRegistry } from "../reflection/DecoratorRegistry"

export type SwaggerFormat = "json" | "yml"

export function buildApiSwaggerSpec() {
    return generateApiSwaggerSpecBuilder().getSpec()
}

export function exportApiSwaggerSpec(format: SwaggerFormat = "json") {
    let openApiBuilder = generateApiSwaggerSpecBuilder()

    return format === "json" ? openApiBuilder.getSpecAsJson() : openApiBuilder.getSpecAsYaml()
}

function generateApiSwaggerSpecBuilder() {
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

    return openApiBuilder
}
