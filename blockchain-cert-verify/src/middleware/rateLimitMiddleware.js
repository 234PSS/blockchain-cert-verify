const rateLimitStore = {};

module.exports = (limit = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = [];
    }

    // Filter out timestamps older than the sliding window
    rateLimitStore[ip] = rateLimitStore[ip].filter(timestamp => now - timestamp < windowMs);

    if (rateLimitStore[ip].length >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      });
    }

    rateLimitStore[ip].push(now);
    next();
  };
};
