import {
  Language,
  ListLanguagesResponse,
} from "@workspace/api-zod";

type LanguageSeed = Omit<
  Language,
  "capabilities"
> & {
  translation: "PARTIAL" | "UNAVAILABLE";
};

const seeds: LanguageSeed[] = [
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", region: "India", script: "Assamese", direction: "ltr", translation: "PARTIAL" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "India / Bangladesh", script: "Bengali", direction: "ltr", translation: "PARTIAL" },
  { code: "brx", name: "Bodo", nativeName: "बड़ो", region: "India", script: "Devanagari", direction: "ltr", translation: "UNAVAILABLE" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी", region: "India", script: "Devanagari", direction: "ltr", translation: "UNAVAILABLE" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", region: "India", script: "Gujarati", direction: "ltr", translation: "PARTIAL" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "India", script: "Devanagari", direction: "ltr", translation: "PARTIAL" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", region: "India", script: "Kannada", direction: "ltr", translation: "PARTIAL" },
  { code: "ks", name: "Kashmiri", nativeName: "کٲشُر", region: "India", script: "Perso-Arabic", direction: "rtl", translation: "UNAVAILABLE" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी", region: "India", script: "Devanagari", direction: "ltr", translation: "UNAVAILABLE" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली", region: "India", script: "Devanagari", direction: "ltr", translation: "UNAVAILABLE" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", region: "India", script: "Malayalam", direction: "ltr", translation: "PARTIAL" },
  { code: "mni", name: "Manipuri / Meitei", nativeName: "মৈতৈলোন", region: "India", script: "Meitei Mayek / Bengali", direction: "ltr", translation: "UNAVAILABLE" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", region: "India", script: "Devanagari", direction: "ltr", translation: "PARTIAL" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", region: "India / Nepal", script: "Devanagari", direction: "ltr", translation: "PARTIAL" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", region: "India", script: "Odia", direction: "ltr", translation: "PARTIAL" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", region: "India / Pakistan", script: "Gurmukhi", direction: "ltr", translation: "PARTIAL" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", region: "India", script: "Devanagari", direction: "ltr", translation: "PARTIAL" },
  { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", region: "India", script: "Ol Chiki", direction: "ltr", translation: "UNAVAILABLE" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي", region: "India / Pakistan", script: "Arabic / Devanagari", direction: "rtl", translation: "UNAVAILABLE" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "India / Sri Lanka", script: "Tamil", direction: "ltr", translation: "PARTIAL" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "India", script: "Telugu", direction: "ltr", translation: "PARTIAL" },
  { code: "ur", name: "Urdu", nativeName: "اردو", region: "India / Pakistan", script: "Perso-Arabic", direction: "rtl", translation: "PARTIAL" },
  { code: "en", name: "English", nativeName: "English", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "es", name: "Spanish", nativeName: "Español", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "fr", name: "French", nativeName: "Français", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "de", name: "German", nativeName: "Deutsch", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "pt", name: "Portuguese", nativeName: "Português", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "it", name: "Italian", nativeName: "Italiano", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "ru", name: "Russian", nativeName: "Русский", region: "International", script: "Cyrillic", direction: "ltr", translation: "PARTIAL" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", region: "International", script: "Cyrillic", direction: "ltr", translation: "PARTIAL" },
  { code: "pl", name: "Polish", nativeName: "Polski", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "cs", name: "Czech", nativeName: "Čeština", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "ro", name: "Romanian", nativeName: "Română", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", region: "International", script: "Greek", direction: "ltr", translation: "PARTIAL" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "ar", name: "Arabic", nativeName: "العربية", region: "International", script: "Arabic", direction: "rtl", translation: "PARTIAL" },
  { code: "he", name: "Hebrew", nativeName: "עברית", region: "International", script: "Hebrew", direction: "rtl", translation: "PARTIAL" },
  { code: "fa", name: "Persian", nativeName: "فارسی", region: "International", script: "Persian", direction: "rtl", translation: "PARTIAL" },
  { code: "zh", name: "Chinese", nativeName: "中文", region: "International", script: "Han", direction: "ltr", translation: "PARTIAL" },
  { code: "ja", name: "Japanese", nativeName: "日本語", region: "International", script: "Japanese", direction: "ltr", translation: "PARTIAL" },
  { code: "ko", name: "Korean", nativeName: "한국어", region: "International", script: "Hangul", direction: "ltr", translation: "PARTIAL" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "th", name: "Thai", nativeName: "ไทย", region: "International", script: "Thai", direction: "ltr", translation: "PARTIAL" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "fil", name: "Filipino", nativeName: "Filipino", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", region: "International", script: "Latin", direction: "ltr", translation: "PARTIAL" },
];

export const languages: Language[] = seeds.map(
  ({ translation, ...language }) => ({
    ...language,
    capabilities: {
      detection: translation,
      translation,
      transliteration: "UNAVAILABLE",
      tts: "UNAVAILABLE",
      stt: "UNAVAILABLE",
      ocr: "UNAVAILABLE",
      imageText: translation === "PARTIAL" ? "PARTIAL" : "UNAVAILABLE",
    },
  }),
);

export const languageRegistry = ListLanguagesResponse.parse(languages);
export const languageByCode = new Map(
  languageRegistry.map((language) => [language.code, language]),
);
