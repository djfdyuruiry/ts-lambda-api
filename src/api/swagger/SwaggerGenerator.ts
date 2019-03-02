import { OpenApiBuilder } from "openapi3-ts"
import { OperationObject, PathItemObject, ParameterObject, ContentObject } from "openapi3-ts/dist/model"

import { DecoratorRegistry } from "../reflection/DecoratorRegistry"
import { EndpointInfo } from "../../model/reflection/EndpointInfo"

export type SwaggerFormat = "json" | "yml"

export class SwaggerGenerator {
    private static readonly ENDPOINTS = DecoratorRegistry.Endpoints

    public static buildApiSwaggerSpec(basicAuthEnabled?: boolean) {
        return SwaggerGenerator.generateApiSwaggerSpecBuilder(basicAuthEnabled).getSpec()
    }

    public static async exportApiSwaggerSpec(
        format: SwaggerFormat = "json",
        basicAuthEnabled?: boolean
    ) {
        let openApiBuilder = SwaggerGenerator.generateApiSwaggerSpecBuilder(basicAuthEnabled)

        if (format === "json") {
            return openApiBuilder.getSpecAsJson()
        }

        try {
            const jsyaml = await import("js-yaml")

            return jsyaml.safeDump(openApiBuilder.getSpec())
        } catch (ex) {
            // TODO: log warning to check that `js-yaml` needs to be installed for yml specs
            throw ex
        }
    }

    private static generateApiSwaggerSpecBuilder(basicAuthEnabled: boolean) {
        let openApiBuilder = OpenApiBuilder.create()

        if (basicAuthEnabled) {
            openApiBuilder = openApiBuilder.addSecurityScheme("basic", {
                scheme: "Basic",
                type: "http"
            })
        }

        for (let endpoint in SwaggerGenerator.ENDPOINTS) {
            if (!SwaggerGenerator.ENDPOINTS.hasOwnProperty(endpoint)) {
                continue
            }

            openApiBuilder = SwaggerGenerator.addEndpoint(
                SwaggerGenerator.ENDPOINTS[endpoint],
                openApiBuilder
            )
        }

        return openApiBuilder
    }

    private static addEndpoint(endpointInfo: EndpointInfo, openApiBuilder: OpenApiBuilder) {
        let pathInfo: PathItemObject = {}
        let endpointMethod = endpointInfo.httpMethod.toLowerCase()
        let endpointOperation: OperationObject = {
            responses: {}
        }

        if (endpointInfo.responseContentType) {
            SwaggerGenerator.setEndpointResponseContentType(
                endpointOperation, endpointInfo.responseContentType
            )
        }

        SwaggerGenerator.addParametersToEndpoint(endpointOperation, endpointInfo)

        pathInfo[endpointMethod] = endpointOperation

        return openApiBuilder.addPath(endpointInfo.fullPath, pathInfo)
    }

    private static setEndpointResponseContentType(
        endpointOperation: OperationObject, responseContentType: string
    ) {
        let responseContent: ContentObject = {}

        responseContent[responseContentType] = {}

        endpointOperation.responses.default = {
            content: responseContent,
            description: ""
        }
    }

    private static addParametersToEndpoint(endpointOperation: OperationObject, endpointInfo: EndpointInfo) {
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
}
