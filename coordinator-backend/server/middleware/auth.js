const jwt = requrie("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]; //extract the jwt token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      return next();
    } catch (err) {
      res
        .status(401)
        .json({ error: "Not authorized, token validation failed" });
    }
  }
  if (!token) {
    return res
      .status(401)
      .json({ error: "Not authorized bearer token missing" });
  }
};
module.exports = { protect };
