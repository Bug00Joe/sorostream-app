import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, "../src/locales");
const enPath = path.join(localesDir, "en.json");
const otherLocales = ["pt.json", "es.json"];

function getKeysDiff(base, target, prefix = "") {
  let missing = [];
  for (const key in base) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (!(key in target)) {
      missing.push(fullKey);
    } else if (typeof base[key] === "object" && base[key] !== null) {
      if (typeof target[key] !== "object" || target[key] === null) {
        missing.push(fullKey);
      } else {
        missing = missing.concat(getKeysDiff(base[key], target[key], fullKey));
      }
    }
  }
  return missing;
}

try {
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  let hasError = false;

  for (const filename of otherLocales) {
    const localePath = path.join(localesDir, filename);
    if (!fs.existsSync(localePath)) {
      console.error(`Missing translation file: ${filename}`);
      hasError = true;
      continue;
    }

    const locale = JSON.parse(fs.readFileSync(localePath, "utf8"));
    const missing = getKeysDiff(en, locale);

    if (missing.length > 0) {
      console.error(`\x1b[31mError: Translation file ${filename} is missing keys from en.json:\x1b[0m`);
      missing.forEach((key) => console.error(`  - ${key}`));
      hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  } else {
    console.log("\x1b[32mAll translations are in sync!\x1b[0m");
    process.exit(0);
  }
} catch (err) {
  console.error("Failed to validate translations:", err);
  process.exit(1);
}
