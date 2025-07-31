import { createResponse } from './response';
import { APIGatewayProxyResult } from 'aws-lambda';

export class ValidationError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export const handleError = (error: unknown): APIGatewayProxyResult => {
  console.error('Error:', error);
  
  if (error instanceof ValidationError) {
    return createResponse(error.statusCode, {
      message: error.message,
    });
  }
  
  if (error instanceof NotFoundError) {
    return createResponse(404, {
      message: error.message,
    });
  }
  
  if (error instanceof ForbiddenError) {
    return createResponse(403, {
      message: error.message,
    });
  }
  
  const statusCode = 500;
  const message = 'Internal server error';
  
  return createResponse(statusCode, {
    message,
    ...(process.env.ENV !== 'prod' && { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  });
};