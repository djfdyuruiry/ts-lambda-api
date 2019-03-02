import { OpenApiBuilder } from "openapi3-ts"
import { OperationObject, PathItemObject, ParameterObject, ContentObject } from "openapi3-ts/dist/model"

import { DecoratorRegistry } from "../reflection/DecoratorRegistry"
import { EndpointInfo } from "../../model/reflection/EndpointInfo"
import { timed } from "../../util/timed";

export type OpenApiFormat = "json" | "yml"

export class OpenApiGenerator {
    private static readonly ENDPOINTS = DecoratorRegistry.Endpoints

    @timed
    public static buildOpenApiSpec(basicAuthEnabled?: boolean) {
        return OpenApiGenerator.generateApiOpenApiSpecBuilder(basicAuthEnabled).getSpec()
    }

    @timed
    public static async exportOpenApiSpec(
        format: OpenApiFormat = "json",
        basicAuthEnabled?: boolean
    ) {
        let openApiBuilder = OpenApiGenerator.generateApiOpenApiSpecBuilder(basicAuthEnabled)

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

    private static generateApiOpenApiSpecBuilder(basicAuthEnabled: boolean) {
        let openApiBuilder = OpenApiBuilder.create()

        if (basicAuthEnabled) {
            openApiBuilder = openApiBuilder.addSecurityScheme("basic", {
                scheme: "Basic",
                type: "http"
            })
        }

        for (let endpoint in OpenApiGenerator.ENDPOINTS) {
            if (!OpenApiGenerator.ENDPOINTS.hasOwnProperty(endpoint)) {
                continue
            }

            openApiBuilder = OpenApiGenerator.addEndpoint(
                OpenApiGenerator.ENDPOINTS[endpoint],
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
            OpenApiGenerator.setEndpointResponseContentType(
                endpointOperation, endpointInfo.responseContentType
            )
        }

        OpenApiGenerator.addParametersToEndpoint(endpointOperation, endpointInfo)

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
