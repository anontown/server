export const authUser: object = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["id", "pass"],
  properties: {
    id: {
      type: "string",
    },
    pass: {
      type: "string",
    }
  }
};

export const recaptcha: object = ["string", "null"];

export const authToken: object = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["id", "key"],
  properties: {
    id: {
      type: "string",
    },
    key: {
      type: "string",
    }
  }
};