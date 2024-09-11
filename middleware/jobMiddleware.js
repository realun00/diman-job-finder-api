import jwt from "jsonwebtoken";
import config from "../config.js";

export default function () {
  return function (req, res, next) {
    if (req.method === "OPTIONS") {
      next();
    }

    try {
      const token = req.headers?.authorization?.split(" ")[1];

      if (!token) {
        return res.status(403).json({ message: "User is not authorized" });
      }

      const { roles: userRoles, id: userId, userName } = jwt.verify(token, config.secret);

      // Allow POST and DELETE requests for liking/unliking jobs
      const isLikeOrUnlikeRequest = req.path.includes('like') || req.path.includes('unlike');

      if (req.method !== "GET" && userRoles?.includes('USER') && !isLikeOrUnlikeRequest) {
        return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
      }

      req.userId = userId;
      req.userName = userName;

      next();
    } catch (error) {
      console.log(error);
      return res.status(403).json({ message: "User is not authorized" });
    }
  };
}
