import { OpenApiBuilder } from "openapi3-ts"
import { OperationObject, PathItemObject, ParameterObject } from "openapi3-ts/dist/model"

import { DecoratorRegistry } from "../reflection/DecoratorRegistry"
import { EndpointInfo } from "../../model/reflection/EndpointInfo"

export type SwaggerFormat = "json" | "yml"

export function buildApiSwaggerSpec() {
    return generateApiSwaggerSpecBuilder().getSpec()
}

export async function exportApiSwaggerSpec(format: SwaggerFormat = "json") {
    let openApiBuilder = generateApiSwaggerSpecBuilder()

    if (format === "json") {
        return openApiBuilder.getSpecAsJson()
    }

    let jsyaml = await import ("js-yaml")

    return jsyaml.safeDump(openApiBuilder.getSpec())
}

function generateApiSwaggerSpecBuilder() {
    let endpoints = DecoratorRegistry.Endpoints
    let openApiBuilder = OpenApiBuilder.create()

    for (let endpoint in endpoints) {
        if (!endpoints.hasOwnProperty(endpoint)) {
            continue
        }

        let endpointInfo = endpoints[endpoint]
        let pathInfo: PathItemObject = {}
        let endpointMethod = endpointInfo.httpMethod.toLowerCase()
        let endpointOperation: OperationObject = {
            responses: {}
        }

        addParametersToEndpoint(endpointOperation, endpointInfo)

        pathInfo[endpointMethod] = endpointOperation

        openApiBuilder = openApiBuilder.addPath(endpointInfo.fullPath, pathInfo)
    }

    return openApiBuilder
}

function addParametersToEndpoint(endpointOperation: OperationObject, endpointInfo: EndpointInfo) {
    endpointOperation.parameters = []

    endpointInfo.parameterExtractors.forEach(p => {
        if (p.source === "virtual") {
            return
        }

        let paramInfo: ParameterObject = {
            in: p.source,
            name: p.name
        }

        endpointOperation.parameters.push(paramInfo)
    })
}
