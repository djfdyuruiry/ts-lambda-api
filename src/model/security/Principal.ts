/**
 * Base class for security principal returned
 * by an authentication filter upon successful
 * request authentication.
 *
 * Extend this class to define a custom principal.
 */
export abstract class Principal {
    protected _name: string

    /**
     * Build a new principal.
     *
     * @param name Name of this principal.
     */
    public constructor(name?: string) {
        this._name = name
    }

    public get name(): string {
        return this._name
    }
}
