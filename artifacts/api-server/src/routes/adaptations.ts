import rateLimit from "express-rate-limit";
import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { CreateAdaptationBody } from "@workspace/api-zod";
import requireAuth from "../middlewares/requireAuth";
import {
  AdaptationConfigurationError,
  AdaptationInputError,
  AdaptationProviderError,
  runAdaptation,
} from "../lib/adaptation";

const router: IRouter = Router();
const adaptationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => getAuth(req).userId ?? "unauthenticated",
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many adaptation requests. Please wait before trying again." },
});

router.post(
  "/adaptations",
  requireAuth,
  adaptationLimiter,
  async (req, res): Promise<void> => {
    const parsed = CreateAdaptationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    try {
      const result = await runAdaptation(parsed.data);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof AdaptationInputError) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof AdaptationConfigurationError) {
        res.status(503).json({ error: error.message });
        return;
      }
      if (error instanceof AdaptationProviderError) {
        req.log.warn({ message: error.message }, "Adaptation provider returned an error");
        res.status(502).json({ error: error.message });
        return;
      }
      req.log.error({ err: error }, "Unexpected adaptation failure");
      res.status(502).json({ error: "The adaptation could not be completed." });
    }
  },
);

export default router;
