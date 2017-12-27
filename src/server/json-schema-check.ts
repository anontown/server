import { Validator } from "jsonschema";
import { AtParamTypeError } from "../at-error";

export function jsonSchemaCheck(value: any, schema: object) {
  const valid = new Validator();
  const result = valid.validate(value, schema);
  if (result.errors.length !== 0) {
    throw new AtParamTypeError(result.errors);
  }
}
