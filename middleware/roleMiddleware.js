import jwt from "jsonwebtoken";
import config from "../config.js";

export default function (roles) {
  return function (req, res, next) {
    if (req.method === "OPTIONS") {
      next();
    }

    try {
      const token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return res.status(403).json({ message: "User is not authorized" });
      }

      const { roles: userRoles, id: userId } = jwt.verify(token, config.secret);

      let hasRole = false;
      userRoles.forEach((role) => {
        if (roles.includes(role)) {
          if (!req.params.id) {
            hasRole = true;
          } else {
            if(role === "ADMIN") {
              hasRole = true;
            } else {
              const id = req.params.id;

                if (String(id) === String(userId)) {
                  hasRole = true;
                } else {
                  hasRole = false;
                }
            }
          }
        }
      });

      if (!hasRole) {
        return res.status(403).json({ message: "No access" });
      }

      next();
    } catch (error) {
      console.log(error);
      return res.status(403).json({ message: "User is not authorized" });
    }
  };
}
