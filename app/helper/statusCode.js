const STATUS_CODE = {
  OK: 200, // Request successful
  CREATED: 201, // Resource created
  BAD_REQUEST: 400, // Invalid request data
  UNAUTHORIZED: 401, // Authentication required
  FORBIDDEN: 403, // Access denied
  NOT_FOUND: 404, // Resource not found
  CONFLICT: 409, // Already exists
  UNPROCESSABLE_ENTITY: 422, // Validation failed
  INTERNAL_SERVER_ERROR: 500, // Server crash or bug
  SERVICE_UNAVAILABLE: 503, // Temporary unavailable
};

module.exports = STATUS_CODE;
