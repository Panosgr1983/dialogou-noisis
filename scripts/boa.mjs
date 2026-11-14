/**
 * Μετατροπή του Nitro output (dist/) σε Vercel Build Output API (.vercel/output).
 *
 * Γιατί χρειάζεται: το `vercel deploy` με framework preset `tanstack-start`
 * παράγει deployment που επιστρέφει 404 σε όλες τις διαδρομές. Το Nitro όμως
 * γράφει έτοιμο BOA-compliant output στο dist/ (config.json v3 + server/ + client/).
 * Αυτό το script το μεταφέρει στη δομή που περιμένει το `vercel deploy --prebuilt`.
 *
 * Χρήση:  npm run build && node scripts/boa.mjs && vercel deploy --prebuilt --prod
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const out = path.join(root, ".vercel", "output");

if (!fs.existsSync(path.join(dist, "config.json"))) {
  console.error("Δεν βρέθηκε dist/config.json — τρέξε πρώτα `npm run build`.");
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "functions"), { recursive: true });
fs.mkdirSync(path.join(out, "static"), { recursive: true });

// 1) routes/config
fs.copyFileSync(path.join(dist, "config.json"), path.join(out, "config.json"));

// 2) static assets
const client = path.join(dist, "client");
if (fs.existsSync(client)) fs.cpSync(client, path.join(out, "static"), { recursive: true });

// 3) SSR function
const serverDir = path.join(dist, "server");
const fnDir = path.join(out, "functions", "__server.func");
fs.cpSync(serverDir, fnDir, { recursive: true });

if (!fs.existsSync(path.join(fnDir, ".vc-config.json"))) {
  console.error("Λείπει το .vc-config.json της function — μη φορητή έκδοση Nitro;");
  process.exit(1);
}

console.log("✔ .vercel/output έτοιμο");
console.log("  functions/__server.func  (" + fs.readdirSync(fnDir).length + " αρχεία)");
console.log(
  "  static/                  (" + fs.readdirSync(path.join(out, "static")).length + " αρχεία)",
);
