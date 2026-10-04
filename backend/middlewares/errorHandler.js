/**
 * Global Centralized Error Handler Middleware
 * Formats all uncaught errors into clean, structured JSON responses.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log error with concise context
  console.error(`[API Error] ${req.method} ${req.originalUrl} - Status ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export default errorHandler;
