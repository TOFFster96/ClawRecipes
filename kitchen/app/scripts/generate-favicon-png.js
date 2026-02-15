/**
 * Generates favicon PNGs from clawcipes_cook.jpg.
 * Run before build; output goes to public/
 */
import sharp from "sharp";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..", "..");
const SOURCE = join(REPO_ROOT, "clawcipes_cook.jpg");
const PUBLIC = join(__dirname, "..", "public");

const favicon = sharp(SOURCE);
await Promise.all([
  favicon.clone().resize(32, 32).png().toFile(join(PUBLIC, "favicon-32x32.png")),
  favicon.clone().resize(16, 16).png().toFile(join(PUBLIC, "favicon-16x16.png")),
  favicon.clone().resize(180, 180).png().toFile(join(PUBLIC, "apple-touch-icon.png")),
]);
