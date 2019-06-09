import { OpenApiBuilder } from "openapi3-ts"
import {
    ContentObject,
    MediaTypeObject,
    OperationObject,
    ParameterObject,
    ParameterStyle,
    PathItemObject,
    RequestBodyObject,
    ResponseObject,
    SchemaObject,
    TagObject
} from "openapi3-ts/dist/model"

import { MiddlewareRegistry } from "../MiddlewareRegistry"
import { DecoratorRegistry } from "../reflection/DecoratorRegistry"
import { BasicAuthFilter } from "../security/BasicAuthFilter"
import { AppConfig } from "../../model/AppConfig"
import { ApiBodyInfo } from "../../model/open-api/ApiBodyInfo"
import { ApiParam } from "../../model/open-api/ApiParam"
import { ControllerInfo } from "../../model/reflection/ControllerInfo"
import { EndpointInfo } from "../../model/reflection/EndpointInfo"
import { IDictionary } from "../../util/IDictionary"
import { toJson } from "../../util/jsonUtils"
import { timed } from "../../util/timed"
import { ILogger } from "../../util/logging/ILogger"
import { LogFactory } from "../../util/logging/LogFactory"

export type OpenApiFormat = "json" | "yml"

export class OpenApiGenerator {
    private static readonly ENDPOINTS = DecoratorRegistry.Endpoints
    private static readonly AUTH_FILTERS = DecoratorRegistry.AuthFilters
    private static readonly OPEN_API_TYPES = [
        "array",
        "array-array",
        "boolean",
        "boolean-array",
        "double",
        "double-array",
        "file",
        "int",
        "int-array",
        "number",
        "number-array",
        "object",
        "object-array",
        "string",
        "string-array"
    ]
    private static readonly OPEN_API_SCHEMA_TYPE_MAP: IDictionary<string> = {
        "array": "array",
        "array-array": "array",
        "boolean": "boolean",
        "boolean-array": "array",
        "double": "number",
        "double-array": "array",
        "file": "string",
        "int": "number",
        "int-array": "array",
        "number": "number",
        "number-array": "array",
        "object": "object",
        "object-array": "array",
        "string": "string",
        "string-array": "array"
    }
    private static readonly OPEN_API_TYPE_EXAMPLES: IDictionary<any> = {
        "array": [],
        "array-array": [[], [], []],
        "boolean": true,
        "boolean-array": [true, false, true],
        "double": 1.1,
        "double-array": [1.1, 2.2, 3.3],
        "file": "upload a file",
        "int": 1,
        "int-array": [1, 2, 3],
        "number": 1.1,
        "object": {},
        "object-array": [{}, {}, {}],
        "string": "a string",
        "string-array": ["1st string", "2nd string", "3rd string"]
    }
    private static readonly FORBIDDEN_HEADER_PARAMS: string[] = [
        "accept",
        "content-type",
        "authorization"
    ]
    private static readonly VALID_PATH_PARAM_STYLES: ParameterStyle[] = [
        "simple",
        "label",
        "matrix"
    ]
    private static readonly VALID_QUERY_OBJECT_PARAM_STYLES: ParameterStyle[] = [
        "form",
        "deepObject"
    ]

    private readonly logger: ILogger

    public constructor(
        private readonly appConfig: AppConfig,
        private readonly middlewareRegistry: MiddlewareRegistry,
        logFactory: LogFactory
    ) {
        this.logger = logFactory.getLogger(OpenApiGenerator)
    }

    @timed
    public buildOpenApiSpec() {
        this.logger.debug("Building raw OpenAPI spec")

        return this.generateApiOpenApiSpecBuilder(this.appConfig, this.middlewareRegistry).getSpec()
    }

    @timed
    public async exportOpenApiSpec(
        format: OpenApiFormat = "json"
    ) {
        let openApiBuilder = this.generateApiOpenApiSpecBuilder(this.appConfig, this.middlewareRegistry)

        if (format === "json") {
            this.logger.debug("Exporting OpenAPI spec as JSON")

            return openApiBuilder.getSpecAsJson()
        }

        try {
            this.logger.debug("Exporting OpenAPI spec as YAML")

            const jsyaml = await import("js-yaml")

            return jsyaml.safeDump(openApiBuilder.getSpec())
        } catch (ex) {
            this.logger.errorWithStack("Error exporting OpenAPI spec as YAML, " +
                "ensure that the 'js-yaml' module is installed", ex)

            throw ex
        }
    }

    private generateApiOpenApiSpecBuilder(appConfig: AppConfig, middlewareRegistry: MiddlewareRegistry) {
        let openApiBuilder = OpenApiBuilder.create()
        let paths: IDictionary<PathItemObject> = {}
        let tags: IDictionary<TagObject> = {}

        this.logger.debug("Generating OpenAPI spec")

        if (appConfig.name) {
            this.logger.trace("title: %s", appConfig.name)

            openApiBuilder.addTitle(appConfig.name)
        }

        if (appConfig.version) {
            this.logger.trace("version: %s", appConfig.version)

            openApiBuilder.addVersion(appConfig.version)
        }

        if (appConfig.base) {
            this.logger.trace("base URL: %s", appConfig.base)

            openApiBuilder.addServer({
                url: appConfig.base
            })
        }

        this.discoverSecuritySchemes(openApiBuilder, middlewareRegistry)

        this.discoverTagsAndPaths(paths, tags)

        // add all discovered tags
        for (let tag in tags) {
            if (!tags.hasOwnProperty(tag)) {
                continue
            }

            this.logger.debug("Adding OpenAPI spec tag: %s", tag)

            openApiBuilder.addTag(tags[tag])
        }

        // add all discovered paths
        for (let path in paths) {
            if (!paths.hasOwnProperty(path)) {
                continue
            }

            this.logger.debug("Adding OpenAPI spec path: %s", path)

            openApiBuilder.addPath(path, paths[path])
        }

        return openApiBuilder
    }

    private discoverSecuritySchemes(openApiBuilder: OpenApiBuilder, middlewareRegistry: MiddlewareRegistry) {
        for (let authFilter of middlewareRegistry.authFilters) {
            let constructor = authFilter.constructor
            let authFilterInfo = OpenApiGenerator.AUTH_FILTERS[constructor.name]

            if (!authFilterInfo && (authFilter instanceof BasicAuthFilter)) {
                authFilterInfo = OpenApiGenerator.AUTH_FILTERS[BasicAuthFilter.name]
            }

            if (authFilterInfo) {
                this.logger.trace("Adding OpenAPI spec security scheme: %s", authFilterInfo.name)

                openApiBuilder = openApiBuilder.addSecurityScheme(
                    authFilterInfo.name,
                    authFilterInfo.securitySchemeInfo
                )
            }
        }
    }

    private discoverTagsAndPaths(paths: IDictionary<PathItemObject>, tags: IDictionary<TagObject>) {
        for (let endpoint in OpenApiGenerator.ENDPOINTS) {
            if (!OpenApiGenerator.ENDPOINTS.hasOwnProperty(endpoint)) {
                continue
            }

            let endpointInfo = OpenApiGenerator.ENDPOINTS[endpoint]

            if (endpointInfo.controller) {
                this.addTagIfPresent(tags, endpointInfo.controller)
            }

            this.addEndpoint(paths, endpointInfo)
        }
    }

    private addTagIfPresent(tags: IDictionary<TagObject>, controller: ControllerInfo) {
        if (!controller.apiName || tags[controller.apiName]) {
            // tag name not defined or already recorded
            return
        }

        this.logger.trace("Adding OpenAPI spec tag for controller: %s", controller.name)

        tags[controller.apiName] = {
            description: controller.apiDescription || "",
            name: controller.apiName
        }
    }

    private addEndpoint(
        paths: IDictionary<PathItemObject>,
        endpointInfo: EndpointInfo
    ) {
        let path = endpointInfo.fullPath

        if (path.length > 1 && path.endsWith("/")) {
            // trim trailing forward slash from path
            path = path.substring(0, path.length - 1)
        }

        let pathInfo: PathItemObject = paths[path] || {}
        let endpointMethod = endpointInfo.httpMethod.toLowerCase()
        let endpointOperation: OperationObject = {
            responses: {}
        }

        this.logger.trace("Adding path for endpoint: %s", endpointInfo.name)

        if (endpointMethod !== "get" && endpointMethod !== "delete") {
            this.setRequestInfo(endpointOperation, endpointInfo)
        }

        if (endpointInfo.responseContentType) {
            this.logger.trace("Setting path response content type: %s",
                endpointInfo.responseContentType)

            // user declared response content type
            this.setEndpointResponseContentType(
                endpointOperation, endpointInfo.responseContentType
            )
        } else {
            this.logger.trace("Setting path response content type to default: application/json")

            // default response content type
            this.setEndpointResponseContentType(
                endpointOperation, "application/json" // use lambda-api content-type default
            )
        }

        if (endpointInfo.apiOperationInfo) {
            this.logger.trace("Setting user defined endpoint info for endpoint: %s", endpointInfo.name)

            // user declared endpoint info
            this.addEndpointOperationInfo(endpointInfo, endpointOperation)
        }

        this.addParametersToEndpoint(endpointOperation, endpointInfo)

        if (endpointInfo.getControllerPropOrDefault(c => c.apiName)) {
            // associate endpoint with controller tag name
            endpointOperation.tags = [endpointInfo.controller.apiName]
        } else if (endpointInfo.controller) {
            endpointOperation.tags = [endpointInfo.controller.name.replace(/Controller$/, "")]
        } else {
            endpointOperation.tags = [endpointInfo.name]
        }

        if (endpointInfo.noAuth) {
            this.logger.trace("Excluding endpoint from security because of noAuth flag: %s", endpointInfo.name)

            // no authentication required, exclude from global security constraints
            endpointOperation.security = []
        }

        pathInfo[endpointMethod] = endpointOperation
        paths[path] = pathInfo
    }

    private setRequestInfo(endpointOperation: OperationObject, endpointInfo: EndpointInfo) {
        let requestInfo = endpointInfo.apiRequestInfo
        let operationRequestType: string

        this.logger.trace("Setting request info for endpoint: %s", endpointInfo.name)

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
        let mediaTypeObject = this.setEndpointRequestContentType(
            endpointOperation,
            operationRequestType,
            requestInfo
        )

        requestInfo.contentType = operationRequestType

        if (!requestInfo || (!requestInfo.type && !requestInfo.class)) {
            this.logger.trace("No request type info found for endpoint: %s", endpointInfo.name)

            // no type info for request body
            return
        }

        this.logger.trace("Adding request schema for endpoint: %s", endpointInfo.name)

        mediaTypeObject.schema = {}

        if (requestInfo.type) {
            mediaTypeObject.schema = this.getPrimitiveTypeSchema(requestInfo)
        } else if (requestInfo.class) {
            this.addClassToMediaTypeObject(
                mediaTypeObject, requestInfo, operationRequestType
            )
        }

        if (requestInfo.example) {
            this.logger.trace("Using user defined request example for endpoint: %s", endpointInfo.name)

            mediaTypeObject.example = requestInfo.example
        } else if (mediaTypeObject.schema) {
            let schema = mediaTypeObject.schema as SchemaObject

            if (schema && schema.example) {
                mediaTypeObject.example = schema.example
            }
        }
    }

    private setEndpointRequestContentType(
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

        this.logger.trace("Endpoint request content type: %s", requestContentType)

        return mediaTypeObject
    }

    private addEndpointOperationInfo(endpointInfo: EndpointInfo, endpointOperation: OperationObject) {
        let operationInfo = endpointInfo.apiOperationInfo
        let responseContentType = endpointInfo.responseContentType || "application/json"

        endpointOperation.summary = operationInfo.name || ""
        endpointOperation.description = operationInfo.description || ""

        if (operationInfo.request) {
            this.setRequestInfo(endpointOperation, endpointInfo)
        }

        for (let statusCode in operationInfo.responses) {
            if (!operationInfo.responses.hasOwnProperty(statusCode)) {
                continue
            }

            this.setEndpointResponseContentType(
                endpointOperation, responseContentType,
                statusCode, operationInfo.responses[statusCode]
            )
        }
    }

    private setEndpointResponseContentType(
        endpointOperation: OperationObject, responseContentType: string,
        statusCode?: string, apiBodyInfo?: ApiBodyInfo
    ) {
        let response: ResponseObject

        if (apiBodyInfo) {
            this.logger.trace("Adding user defined response info")

            // user defined response body info
            let responseContent: ContentObject = {}
            let mediaTypeObject: MediaTypeObject = {}

            apiBodyInfo.contentType = (apiBodyInfo.contentType || responseContentType).toLowerCase()

            let responseType = apiBodyInfo.contentType

            responseContent[responseType] = mediaTypeObject

            response = {
                content: responseContent,
                description: apiBodyInfo.description || ""
            }

            if (apiBodyInfo.type) {
                this.logger.trace("Building response schema from primitive type")

                mediaTypeObject.schema = this.getPrimitiveTypeSchema(apiBodyInfo)
            } else if (apiBodyInfo.class) {
                this.logger.trace("Building response schema from class type")

                this.addClassToMediaTypeObject(
                    mediaTypeObject, apiBodyInfo, responseType
                )
            }

            if (apiBodyInfo.example) {
                this.logger.trace("Using user defined response example: %s", apiBodyInfo.example)

                mediaTypeObject.example = apiBodyInfo.example
            } else if (mediaTypeObject.schema) {
                let schema = mediaTypeObject.schema as SchemaObject

                if (schema && schema.example) {
                    this.logger.trace("Using schema provided response example: %s", schema.example)

                    mediaTypeObject.example = schema.example
                }
            } else {
                this.logger.trace("No example defined for OpenAPI response request")
            }
        } else {
            this.logger.trace("Setting response content type: %s", responseContentType)

            // response content type only
            let responseContent: ContentObject = {}
            responseContent[responseContentType] = {}

            response = {
                content: responseContent,
                description: "" // required or swagger ui will throw errors
            }
        }

        if (statusCode) {
            this.logger.trace("Setting response for HTTP %s: %j",
                statusCode, response)

            endpointOperation.responses[statusCode] = response
        } else {
            this.logger.trace("Setting path default response: %j", response)

            endpointOperation.responses.default = response
        }
    }

    private getPrimitiveTypeSchema(apiBodyInfo: ApiBodyInfo | ApiParam) {
        let type = apiBodyInfo.type.toLowerCase()

        if (!OpenApiGenerator.OPEN_API_TYPES.includes(type)) {
            this.logger.trace("Skipping adding unknown body type to OpenAPI spec: %s", type)

            return
        }

        let schemaType = OpenApiGenerator.OPEN_API_SCHEMA_TYPE_MAP[type]

        if (type !== "file") {
            this.logger.trace("Setting body to type: %s", type)

            let schema: SchemaObject = {
                type: schemaType
            }

            if (schemaType === "array") {
                this.addPrimitiveArrayInfoToSchema(schema, apiBodyInfo.type)
            }

            if (schemaType === "array" || schemaType === "object") {
                if (!apiBodyInfo.contentType ||
                    apiBodyInfo.contentType.toLowerCase() !== "application/json") {
                    // exclude object or array examples if content type is non-json
                    return schema
                }
            }

            schema.example = this.getPrimitiveTypeExample(type)

            return schema
        } else {
            this.logger.trace("Setting body to file")

            return {
                format: "binary",
                type: schemaType
            }
        }
    }

    private getPrimitiveTypeExample(type: string) {
        let example = OpenApiGenerator.OPEN_API_TYPE_EXAMPLES[type]

        this.logger.trace("Adding body example: %s", example)

        return toJson(example)
    }

    private addPrimitiveArrayInfoToSchema(schema: SchemaObject, type: string) {
        let itemType = type.replace("-array", "")
        let itemSchemaType = OpenApiGenerator.OPEN_API_SCHEMA_TYPE_MAP[itemType]

        // ensure array items have a type
        schema.items = {
            type: itemSchemaType
        }

        if (itemSchemaType === "object") {
            // ensure object items can have any properties
            schema.items.additionalProperties = true
        } else if (itemSchemaType === "array") {
            // ensure arrays inside an array have any item types
            schema.items.items = {
                additionalProperties: true,
                type: "object"
            }
        }
    }

    private addClassToMediaTypeObject(
        mediaTypeObject: MediaTypeObject,
        apiBodyInfo: ApiBodyInfo | ApiParam,
        responseContentType: string
    ) {
        let clazz: any = apiBodyInfo.class
        let instance: any

        if ((typeof clazz.example) === "function") {
            this.logger.trace("Getting body info from 'example' method of class: %s",
                apiBodyInfo.class.name)

            instance = clazz.example()
        } else {
            this.logger.trace("Getting body info from default contructor of class: %s",
                apiBodyInfo.class.name)

            instance = new clazz()
        }

        let instanceType = "object"

        if (!(instance instanceof clazz)) {
            instanceType = this.getInstanceType(instance)

            if (!OpenApiGenerator.OPEN_API_TYPES.includes(instanceType)) {
                // not a supported type or null/undefined, ommit this property
                this.logger.trace("Ignoring class '%s' as it is of an invalid type: %s",
                    apiBodyInfo.class.name, instanceType)

                return
            }
        }

        let schema: SchemaObject = {
            type: instanceType
        }

        mediaTypeObject.schema = schema

        if (responseContentType === "application/json") {
            let exampleJson = toJson(instance)

            this.logger.trace("Adding JSON body example: %s", exampleJson)

            mediaTypeObject.example  = exampleJson
            schema.example = exampleJson
        }

        if (instanceType === "object") {
            this.addObjectPropertiesToSchema(schema, instance)
        } else if (instanceType === "array") {
            if (instance.length > 0) {
                this.addArrayToSchema(schema, instance)
            } else {
                this.logger.trace("Ignoring class '%s' array as it has no items in it's example",
                    apiBodyInfo.class.name)

                delete mediaTypeObject.schema
                return
            }
        } else {
            schema.example = instance
            mediaTypeObject.example = instance
        }
    }

    private addObjectPropertiesToSchema(schema: SchemaObject, instance: any) {
        let objectProperties = Object.getOwnPropertyNames(instance)

        for (let property of objectProperties) {
            let type = this.getTypeOfInstanceProperty(instance, property)

            if (!OpenApiGenerator.OPEN_API_TYPES.includes(type)) {
                // not a supported type or null/undefined, ommit this property
                this.logger.trace("Ignoring property '%s' as it is of an invalid type: %s", property, type)

                continue
            }

            let propertySchema: SchemaObject = {
                type
            }

            if (type === "object") {
                // get schema for property object
                propertySchema.example = toJson(instance[property])

                this.addObjectPropertiesToSchema(propertySchema, instance[property])
            } else if (type === "array") {
                if (instance[property].length > 0) {
                    if (!this.addArrayToSchema(propertySchema, instance[property])) {
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

    private addArrayToSchema(propertySchema: SchemaObject, instance: any) {
        let itemType = this.getInstanceType(instance[0])

        if (!OpenApiGenerator.OPEN_API_TYPES.includes(itemType)) {
            return false
        }

        propertySchema.example = toJson(instance)
        propertySchema.items = {
            type: itemType
        }

        if (itemType === "object") {
            propertySchema.items.example = toJson(instance[0])

            // get schema for array item type
            this.addObjectPropertiesToSchema(
                propertySchema.items,
                instance[0]
            )
        } else if (itemType === "array") {
            if (instance.length > 0) {
                this.addArrayToSchema(propertySchema.items, instance[0])
            }
        } else {
            propertySchema.items.example = instance[0]
        }

        return true
    }

    private getTypeOfInstanceProperty(instance: any, property: string | number) {
        return this.getInstanceType(instance[property])
    }

    private getInstanceType(instance: any) {
        let type = ((typeof instance)).toLowerCase()

        if (type === "object" && Array.isArray(instance)) {
            // the property is actually an array
            type = "array"
        }

        return type
    }

    private addParametersToEndpoint(endpointOperation: OperationObject, endpointInfo: EndpointInfo) {
        endpointOperation.parameters = []

        endpointInfo.parameterExtractors.forEach(p => {
            if (p.source === "virtual") {
                return
            }

            if (p.source === "header" &&
                OpenApiGenerator.FORBIDDEN_HEADER_PARAMS.includes(p.name.toLowerCase())) {
                this.logger.debug("Parameter for header %s is forbidden by the OpenAPI v3 Spec", p.name)
                return;
            }

            let paramInfo: ParameterObject = {
                in: p.source,
                name: p.name,
                schema: {} // required, or breaks query parameters
            }

            if (p.apiParamInfo) {
                this.addEndpointParameterInfo(paramInfo, p.apiParamInfo)
            }

            if (p.source === "path") {
                // swagger ui will break if this is not set to true
                paramInfo.required = true
            }

            endpointOperation.parameters.push(paramInfo)
        })

        this.logger.trace("Setting path parameters: %j", endpointOperation.parameters)
    }

    private addEndpointParameterInfo(paramInfo: ParameterObject, apiParamInfo: ApiParam) {
        // remove any previously written schema
        delete paramInfo.schema

        let paramContentType = apiParamInfo.contentType
        let mediaTypeObject: MediaTypeObject = {}

        if (paramContentType) {
            // we have a content type, use it in the param info
            paramInfo.content = {}
            paramInfo.content[paramContentType] = mediaTypeObject
        }

        if (apiParamInfo.type) {
            mediaTypeObject.schema = this.getPrimitiveTypeSchema(apiParamInfo)

            if (apiParamInfo.type.endsWith("array")) {
                this.setParamValueStyle(paramInfo, apiParamInfo)
            }
        } else if (apiParamInfo.class) {
            this.addClassToMediaTypeObject(
                mediaTypeObject, apiParamInfo, paramContentType
            )

            this.setParamValueStyle(paramInfo, apiParamInfo)
        } else {
            apiParamInfo.type = "string"

            mediaTypeObject.schema = this.getPrimitiveTypeSchema(apiParamInfo)
        }

        if (apiParamInfo.example) {
            mediaTypeObject.example = apiParamInfo.example
        }

        if (!paramInfo.content) {
            // we don't have info in content, place schema and example inside param info
            if (mediaTypeObject.schema) {
                paramInfo.schema = mediaTypeObject.schema
            }

            if (mediaTypeObject.example) {
                paramInfo.example = mediaTypeObject.example
            }
        } else if (mediaTypeObject.example) {
            // copy the media type example up to the top level
            paramInfo.example = mediaTypeObject.example
        }

        if (typeof apiParamInfo.required === "boolean") {
            paramInfo.required = apiParamInfo.required
        }

        if (apiParamInfo.description) {
            paramInfo.description = apiParamInfo.description
        }
    }

    private setParamValueStyle(paramInfo: ParameterObject, apiParamInfo: ApiParam) {
        if (paramInfo.content) {
            // can't set style or explode if a content type is provided
            return
        }

        if (typeof apiParamInfo.explode === "boolean") {
            paramInfo.explode = apiParamInfo.explode
        }

        if (!apiParamInfo.style) {
            return
        }

        if (paramInfo.in === "header" && apiParamInfo.style !== "simple") {
            this.logger.debug(
                "Header parameters only support the simple style, style '%s' ignored",
                apiParamInfo.style
            )

            return
        }

        if (paramInfo.in === "path") {
            if (!OpenApiGenerator.VALID_PATH_PARAM_STYLES.includes(apiParamInfo.style)) {
                this.logger.debug("'%s' is not a valid path param style", apiParamInfo.style)
                return
            }
        }

        if (paramInfo.in === "query") {
            if (!apiParamInfo.class && apiParamInfo.style === "deepObject") {
                this.logger.debug("'deepObject' style is only supported for object query string parameters")
                return
            }

            if (apiParamInfo.class &&
                !OpenApiGenerator.VALID_QUERY_OBJECT_PARAM_STYLES.includes(apiParamInfo.style)) {
                this.logger.debug("'%s' is not a valid style for object query string parameters", paramInfo.style)
                return
            }
        }

        paramInfo.style = apiParamInfo.style
    }
}
