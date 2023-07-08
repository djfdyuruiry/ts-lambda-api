import { SecuritySchemeObject } from "openapi3-ts/oas31";

export class AuthFilterInfo {
    public name?: string
    public securitySchemeInfo?: SecuritySchemeObject
}
