import { Router, type IRouter } from "express";
import {
  GetLanguageParams,
  GetLanguageResponse,
  ListLanguagesResponse,
} from "@workspace/api-zod";
import { languageByCode, languageRegistry } from "../lib/languages";

const router: IRouter = Router();

router.get("/languages", (_req, res): void => {
  res.json(ListLanguagesResponse.parse(languageRegistry));
});

router.get("/languages/:code", (req, res): void => {
  const params = GetLanguageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const language = languageByCode.get(params.data.code.toLowerCase());
  if (!language) {
    res.status(404).json({ error: "Language not found." });
    return;
  }

  res.json(GetLanguageResponse.parse(language));
});

export default router;
