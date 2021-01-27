import { IsNumber, IsOptional, IsString } from 'class-validator';
import { injectable } from "inversify"

import { apiController, body, Controller, JsonPatch, rawBody, GET, POST, PUT, PATCH, DELETE, bodyTyped } from "../../../dist/ts-lambda-api"

import { Person } from "../test-components/model/Person"

class TypedRequest {
  @IsNumber() public id: number;
  @IsOptional() @IsString() name: string;

  public render() {
    return `${this.id}/${this.name}`;
  }
}

@apiController("/test/methods")
@injectable()
export class MethodTestsController extends Controller {
    @POST("/post")
    public post(@body person: Person) {
        return person
    }

    @POST("/post-raw")
    public postFile(@rawBody file: Buffer) {
        this.response.sendFile(file)
    }

    @POST("/post-typed")
    public postTyped(@bodyTyped(TypedRequest) request: TypedRequest) {
      return request.render();
    }

    @POST("/post-validated")
    public postValidated(@bodyTyped(TypedRequest, { validate: true }) request: TypedRequest) {
      return request.render();
    }

    @POST("/post-validated-no-whitelist")
    public postValidatedNoWhitelist(@bodyTyped(TypedRequest, { validate: true, forbidNonWhitelisted: false }) request: TypedRequest) {
      return request.render();
    }

    @PUT("/put")
    public put(@body person: Person) {
        return person
    }

    @PATCH("/patch")
    public patch(@body jsonPatch: JsonPatch) {
        let somePerson: Person = {
            name: "Should Not Come Back",
            age: 42
        }

        return this.applyJsonPatch<Person>(jsonPatch, somePerson)
    }

    @DELETE("/delete")
    public delete() {
        this.response.status(204).send("")
    }

    @GET("/raise-error")
    public raiseError() {
        throw new Error("Panic!")
    }
}
