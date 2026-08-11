module.exports = (err, req, res, next) => {
  console.error('[ERROR]', err.stack || err);
  
  const statusCode = err.status || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred.',
    errorCode: errorCode
  });
};
