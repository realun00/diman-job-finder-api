// middleware/applicationMiddleware.js

const applicationMiddleware = (roles) => {
    return (req, res, next) => {
      // Assuming req.userId is set by auth middleware
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      // Check user roles and proceed based on roles
      const userRoles = req.user.roles; // Assuming req.user is set by auth middleware
  
      if (roles.some(role => userRoles.includes(role))) {
        next();
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    };
  };
  
  export default applicationMiddleware;