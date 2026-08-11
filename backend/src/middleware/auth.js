const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', errorCode: 'UNAUTHORIZED', message: 'Missing or invalid authorization header.' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ status: 'error', errorCode: 'UNAUTHORIZED', message: 'Invalid or expired auth session.' });
    }

    // Attach user information
    req.user = user;

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    req.user.role = profile ? profile.role : 'user';

    next();
  } catch (err) {
    next(err);
  }
};

const requireAdmin = async (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ status: 'error', errorCode: 'FORBIDDEN', message: 'Administrator access required.' });
    }
  });
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      req.user = user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      req.user.role = profile ? profile.role : 'user';
    }
    next();
  } catch (err) {
    next(); // Continue even if auth fails
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth
};
