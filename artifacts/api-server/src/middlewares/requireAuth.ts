import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Sign in to adapt content." });
    return;
  }
  next();
};

export default requireAuth;
