import { AtParamTypeError } from '../at-error';
import { Validator } from 'jsonschema';

export function jsonSchemaCheck(value: any, schema: object) {
  let valid = new Validator();
  let result = valid.validate(value, schema);
  if (result.errors.length !== 0) {
    throw new AtParamTypeError(result.errors);
  }
}