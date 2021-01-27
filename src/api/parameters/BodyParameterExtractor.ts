import { plainToClass } from 'class-transformer'
import { validateSync, ValidatorOptions } from 'class-validator'
import { Request } from "lambda-api"

import { BaseParameterExtractor } from "./BaseParameterExtractor"

export class BodyParameterExtractor extends BaseParameterExtractor {
    public readonly source = "virtual"
    public readonly name = "body"

    public constructor(private type?: new() => any, private options?: ValidatorOptions & { validate?: boolean } ) {
        super(BodyParameterExtractor)
    }

    public extract(request: Request) {
        this.logger.debug("Extracting body from request")
        this.logger.trace("Request body: %j", request.body)

        if (!this.type) {
          return request.body
        } else {
          const obj = plainToClass(this.type, request.body);

          if (this.options?.validate) {
            this.options.forbidNonWhitelisted = this.options.forbidNonWhitelisted ?? true;
            this.options.whitelist = this.options.whitelist ?? true;

            const errors = validateSync(obj, this.options);

            if (errors.length > 0) {
              throw errors;
            }
          }
          return obj;
        }
    }
}
