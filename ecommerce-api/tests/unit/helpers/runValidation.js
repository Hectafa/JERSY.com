import { validationResult } from "express-validator";

export const runValidation = async (validations, req) => {
  await Promise.all(validations.map((validation) => validation.run(req)));
  return validationResult(req);
};

export const fakeReq = ({ body = {}, params = {}, query = {} } = {}) => ({
  body,
  params,
  query,
});
