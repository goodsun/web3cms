export const ERROR_MESSAGES = {
  // Generic messages
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  NOT_FOUND: (resource: string) => `${resource} not found`,
  NO_PERMISSION: 'You do not have permission to perform this action',
  INTERNAL_ERROR: 'Internal server error',
  METHOD_NOT_ALLOWED: 'Method not allowed',
  
  // Specific messages
  BODY_REQUIRED: 'Request body is required',
  ID_REQUIRED: 'ID is required',
  ID_AND_BODY_REQUIRED: 'ID and request body are required',
  ITEM_NOT_FOUND: 'Item not found',
  FOLDER_NOT_FOUND: 'Folder not found',
  CONTENT_NOT_FOUND: 'Content not found',
  SETTINGS_NOT_FOUND: 'Settings not found',
  
  // Validation messages
  INVALID_JSON: 'Invalid JSON in request body',
  INVALID_STATUS: 'Invalid status value',
  INVALID_CONTENT_TYPE: 'Invalid content type',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: (resource: string) => `${resource} created successfully`,
  UPDATED: (resource: string) => `${resource} updated successfully`,
  DELETED: (resource: string) => `${resource} deleted successfully`,
} as const;