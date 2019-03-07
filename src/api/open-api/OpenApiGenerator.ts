import { OpenApiBuilder } from "openapi3-ts"
import {
    OperationObject,
    PathItemObject,
    ParameterObject,
    ContentObject,
    ResponseObject,
    TagObject,
    RequestBodyObject,
    MediaTypeObject,
    SchemaObject
} from "openapi3-ts/dist/model"

import { DecoratorRegistry } from "../reflection/DecoratorRegistry"
import { ApiBodyInfo } from "../../model/open-api/ApiBodyInfo"
import { ControllerInfo } from "../../model/reflection/ControllerInfo"
import { EndpointInfo } from "../../model/reflection/EndpointInfo"
import { IDictionary } from "../../util/IDictionary"
import { timed } from "../../util/timed";

export type OpenApiFormat = "json" | "yml"

export class OpenApiGenerator {
    private static readonly ENDPOINTS = DecoratorRegistry.Endpoints
    private static readonly OPEN_API_TYPES = ["number", "string", "boolean", "object", "array"]

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
        let paths: IDictionary<PathItemObject> = {}
        let tags: IDictionary<TagObject> = {}

        if (basicAuthEnabled) {
            openApiBuilder = openApiBuilder.addSecurityScheme("basic", {
                scheme: "Basic",
                type: "http"
            })
        }

        OpenApiGenerator.discoverTagsAndPaths(paths, tags)

        // add all discovered tags
        for (let tag in tags) {
            if (!tags.hasOwnProperty(tag)) {
                continue
            }

            openApiBuilder = openApiBuilder.addTag(tags[tag])
        }

        // add all discovered paths
        for (let path in paths) {
            if (!paths.hasOwnProperty(path)) {
                continue
            }

            openApiBuilder = openApiBuilder.addPath(path, paths[path])
        }

        return openApiBuilder
    }

    private static discoverTagsAndPaths(paths: IDictionary<PathItemObject>, tags: IDictionary<TagObject>) {
        for (let endpoint in OpenApiGenerator.ENDPOINTS) {
            if (!OpenApiGenerator.ENDPOINTS.hasOwnProperty(endpoint)) {
                continue
            }

            let endpointInfo = OpenApiGenerator.ENDPOINTS[endpoint]

            if (endpointInfo.controller) {
                OpenApiGenerator.addTagIfPresent(tags, endpointInfo.controller)
            }

            OpenApiGenerator.addEndpoint(paths, endpointInfo)
        }
    }

    private static addTagIfPresent(tags: IDictionary<TagObject>, controller: ControllerInfo) {
        if (!controller.apiName || tags[controller.apiName]) {
            // tag name not defined or already recorded
            return
        }

        tags[controller.apiName] = {
            description: controller.apiDescription,
            name: controller.apiName
        }
    }

    private static addEndpoint(
        paths: IDictionary<PathItemObject>,
        endpointInfo: EndpointInfo
    ) {
        let path = endpointInfo.fullPath

        if (path.endsWith("/")) {
            // trim trailing forward slash from path
            path = path.substring(0, path.length - 1)
        }

        let pathInfo: PathItemObject = paths[path] || {}
        let endpointMethod = endpointInfo.httpMethod.toLowerCase()
        let endpointOperation: OperationObject = {
            responses: {}
        }

        if (endpointMethod !== "get" && endpointMethod !== "delete") {
            OpenApiGenerator.setRequestInfo(endpointOperation, endpointInfo)
        }

        if (endpointInfo.responseContentType) {
            // user declared response content type
            OpenApiGenerator.setEndpointResponseContentType(
                endpointOperation, endpointInfo.responseContentType
            )
        } else {
            // default response content type
            OpenApiGenerator.setEndpointResponseContentType(
                endpointOperation, "application/json" // use lambda-api content-type default
            )
        }

        if (endpointInfo.apiOperationInfo) {
            // user declared endpoint info
            OpenApiGenerator.addEndpointOperationInfo(endpointInfo, endpointOperation)
        }

        OpenApiGenerator.addParametersToEndpoint(endpointOperation, endpointInfo)

        if (endpointInfo.getControllerPropOrDefault(c => c.apiName)) {
            // associate endpoint with controller tag name
            endpointOperation.tags = [endpointInfo.controller.apiName]
        }

        pathInfo[endpointMethod] = endpointOperation
        paths[path] = pathInfo
    }

    private static setRequestInfo(endpointOperation: OperationObject, endpointInfo: EndpointInfo) {
        let requestInfo = endpointInfo.apiRequestInfo
        let operationRequestType: string

        if (requestInfo) {
            operationRequestType = requestInfo.contentType ||
            endpointInfo.requestContentType ||
            "application/json"
        }

        operationRequestType = operationRequestType ||
            endpointInfo.requestContentType

        if (!operationRequestType) {
            return
        }

        operationRequestType = operationRequestType.toLowerCase()

        // user declared request content type
        let mediaTypeObject = OpenApiGenerator.setEndpointRequestContentType(
            endpointOperation,
            operationRequestType,
            requestInfo
        )

        if (!requestInfo || (!requestInfo.type && !requestInfo.class)) {
            // no type info for request body
            return
        }

        mediaTypeObject.schema = {}

        if (requestInfo.type) {
            OpenApiGenerator.addPrimitiveToMediaTypeObject(mediaTypeObject, requestInfo)
        } else if (requestInfo.class) {
            OpenApiGenerator.addClassToMediaTypeObject(
                mediaTypeObject, requestInfo, operationRequestType
            )
        }

        if (requestInfo.example) {
            mediaTypeObject.example = requestInfo.example
        }
    }

    private static setEndpointRequestContentType(
        endpointOperation: OperationObject,
        requestContentType: string,
        requestInfo: ApiBodyInfo
    ) {
        let requestBody: RequestBodyObject = {
            content: {},
            description: requestInfo ? (requestInfo.description || "") : ""
        }
        let mediaTypeObject: MediaTypeObject = {}

        requestBody.content[requestContentType] = mediaTypeObject

        endpointOperation.requestBody = requestBody

        return mediaTypeObject
    }

    private static addEndpointOperationInfo(endpointInfo: EndpointInfo, endpointOperation: OperationObject) {
        let operationInfo = endpointInfo.apiOperationInfo
        let responseContentType = endpointInfo.responseContentType || "application/json"

        endpointOperation.summary = operationInfo.name
        endpointOperation.description = operationInfo.description

        if (operationInfo.request) {
            OpenApiGenerator.setRequestInfo(endpointOperation, endpointInfo)
        }

        for (let statusCode in operationInfo.responses) {
            if (!operationInfo.responses.hasOwnProperty(statusCode)) {
                continue
            }

            OpenApiGenerator.setEndpointResponseContentType(
                endpointOperation, responseContentType,
                statusCode, operationInfo.responses[statusCode]
            )
        }
    }

    private static setEndpointResponseContentType(
        endpointOperation: OperationObject, responseContentType: string,
        statusCode?: string, apiBodyInfo?: ApiBodyInfo
    ) {
        let response: ResponseObject

        if (apiBodyInfo) {
            // user defined response body info
            let responseContent: ContentObject = {}
            let mediaTypeObject: MediaTypeObject = {}
            let responseType = (apiBodyInfo.contentType || responseContentType).toLowerCase()

            responseContent[responseType] = mediaTypeObject

            response = {
                content: responseContent,
                description: apiBodyInfo.description || ""
            }

            if (apiBodyInfo.type) {
                OpenApiGenerator.addPrimitiveToMediaTypeObject(mediaTypeObject, apiBodyInfo)
            } else if (apiBodyInfo.class) {
                OpenApiGenerator.addClassToMediaTypeObject(
                    mediaTypeObject, apiBodyInfo, responseType
                )
            }
        } else {
            // response content type only
            let responseContent: ContentObject = {}
            responseContent[responseContentType] = {}

            response = {
                content: responseContent,
                description: "" // required or swagger ui will throw errors
            }
        }

        if (statusCode) {
            endpointOperation.responses[statusCode] = response
        } else {
            endpointOperation.responses.default = response
        }
    }

    private static addPrimitiveToMediaTypeObject(mediaTypeObject: MediaTypeObject, apiBodyInfo: ApiBodyInfo) {
        let type = apiBodyInfo.type.toLowerCase()

        if (type !== "file") {
            mediaTypeObject.schema = {
                type: apiBodyInfo.type
            }
        } else {
            mediaTypeObject.schema = {
                format: "binary",
                type: "string"
            }
        }
    }

    private static addClassToMediaTypeObject(
        mediaTypeObject: MediaTypeObject,
        apiBodyInfo: ApiBodyInfo,
        responseContentType: string
    ) {
        let clazz: any = apiBodyInfo.class
        let instance: any

        if ((typeof clazz.example) === "function") {
            instance = clazz.example()
        } else {
            instance = new clazz()
        }

        let schema: SchemaObject = {
            properties: {},
            type: "object"
        }

        mediaTypeObject.schema = schema

        if (responseContentType === "application/json") {
            let exampleJson = JSON.stringify(instance, null, 4)

            mediaTypeObject.example  = exampleJson
            schema.example = exampleJson
        }

        OpenApiGenerator.addObjectPropertiesToSchema(mediaTypeObject.schema, instance)
    }

    private static addObjectPropertiesToSchema(schema: SchemaObject, instance: any) {
        let objectProperties = Object.getOwnPropertyNames(instance)

        for (let property of objectProperties) {
            let type = OpenApiGenerator.getTypeOfInstanceProperty(instance, property)

            if (!OpenApiGenerator.OPEN_API_TYPES.includes(type)) {
                // not a supported type or null/undefined, ommit this property
                continue
            }

            let propertySchema: SchemaObject = {
                type
            }

            if (type === "object") {
                // get schema for property object
                propertySchema.example = JSON.stringify(instance[property], null, 4)

                OpenApiGenerator.addObjectPropertiesToSchema(propertySchema, instance[property])
            } else if (type === "array") {
                if (instance[property].length > 0) {
                    if (!OpenApiGenerator.addArrayToSchema(propertySchema, instance[property])) {
                        // unsupported array item type or null/undefined, ommit this property
                        continue
                    }
                } else {
                    // no way to determine array item type, so better to ommit this property
                    continue
                }
            } else {
                propertySchema.example = instance[property]
            }

            if (!schema.properties) {
                schema.properties = {}
            }

            schema.properties[property] = propertySchema
        }
    }

    private static addArrayToSchema(propertySchema: SchemaObject, instance: any) {
        let itemType = OpenApiGenerator.getInstanceType(instance[0])

        if (!OpenApiGenerator.OPEN_API_TYPES.includes(itemType)) {
            return false
        }

        propertySchema.example = JSON.stringify(instance, null, 4)
        propertySchema.items = {
            type: itemType
        }

        if (itemType === "object") {
            propertySchema.items.example = JSON.stringify(instance[0], null, 4)

            // get schema for array item type
            OpenApiGenerator.addObjectPropertiesToSchema(
                propertySchema.items,
                instance[0]
            )
        } else if (itemType === "array") {
            if (instance.length > 0) {
                OpenApiGenerator.addArrayToSchema(propertySchema.items, instance[0])
            }
        } else {
            propertySchema.items.example = instance[0]
        }

        return true
    }

    private static getTypeOfInstanceProperty(instance: any, property: string | number) {
        return OpenApiGenerator.getInstanceType(instance[property])
    }

    private static getInstanceType(instance: any) {
        let type = ((typeof instance)).toLowerCase()

        if (type === "object" && Array.isArray(instance)) {
            // detect if the property is actually an array
            type = "array"
        }

        return type
    }

    private static addParametersToEndpoint(endpointOperation: OperationObject, endpointInfo: EndpointInfo) {
        endpointOperation.parameters = []

        endpointInfo.parameterExtractors.forEach(p => {
            if (p.source === "virtual") {
                return
            }

            let paramInfo: ParameterObject = {
                in: p.source,
                name: p.name,
                schema: {} // required, or breaks query parameters
            }

            if (p.source === "path") {
                // swagger ui will break if this is not set to true
                paramInfo.required = true
            }

            endpointOperation.parameters.push(paramInfo)
        })
    }
}
