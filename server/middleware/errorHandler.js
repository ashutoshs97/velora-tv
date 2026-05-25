export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) {
    console.error('[ERROR]', req.method, req.path, '-', err.message);
  } else {
    console.warn('[WARN]', req.method, req.path, '-', err.message);
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? (status === 404 ? 'Not found' : 'Internal server error')
      : err.message,
  });
};
