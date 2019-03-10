import { SecuritySchemeObject } from "openapi3-ts";

export class AuthFilterInfo {
    public name?: string
    public securitySchemeInfo?: SecuritySchemeObject
}
