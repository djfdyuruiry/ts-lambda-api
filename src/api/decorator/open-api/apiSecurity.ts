import { SecuritySchemeObject } from "openapi3-ts/oas31"

import { DecoratorRegistry } from "../../reflection/DecoratorRegistry"

/**
 * Decorator for a auth filter implementation to describe it in any generated
 * OpenAPI specification as a security scheme.
 *
 * @param name Name of the API security scheme.
 * @param securitySchemeInfo `openapi3-ts` security scheme model.
 */
export function apiSecurity(name: string, securitySchemeInfo: SecuritySchemeObject) {
    return (classDefinition: Function) => {
        let authFilterInfo = DecoratorRegistry.getOrCreateAuthFilter(classDefinition)

        DecoratorRegistry.getLogger().debug("@apiSecurity('%s', %j) decorator executed for auth filter: %s",
            name,
            securitySchemeInfo,
            authFilterInfo.name)

        authFilterInfo.name = name
        authFilterInfo.securitySchemeInfo = securitySchemeInfo
    }
}
