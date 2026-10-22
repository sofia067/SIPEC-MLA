export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Tu rol no tiene permisos para esta operación.' },
      });
    }
    return next();
  };
}
