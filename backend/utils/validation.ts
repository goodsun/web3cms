import { ValidationError } from './errors';

export const validateRequired = (value: any, fieldName: string): void => {
  if (!value) {
    throw new ValidationError(400, `${fieldName} is required`);
  }
};

export const validateRequestBody = (body: string | null): any => {
  if (!body) {
    throw new ValidationError(400, 'Request body is required');
  }
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new ValidationError(400, 'Invalid JSON in request body');
  }
};