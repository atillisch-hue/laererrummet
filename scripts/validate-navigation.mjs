import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appRoot = path.join(root, "app");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(appRoot);
const pageFiles = files.filter((file) => path.basename(file) === "page.tsx");

function routeForPage(file) {
  const rel = path.relative(appRoot, path.dirname(file)).replaceAll(path.sep, "/");
  return rel ? `/${rel}` : "/";
}

const routes = pageFiles.map(routeForPage).filter((route) => !route.startsWith("/api/"));

function segmentMatch(pattern, actual) {
  if (pattern.startsWith("[[...") && pattern.endsWith("]]")) return true;
  if (pattern.startsWith("[...") && pattern.endsWith("]")) return actual.length > 0;
  if (pattern.startsWith("[") && pattern.endsWith("]")) return actual.length > 0;
  return pattern === actual;
}

function routeMatches(pattern, pathname) {
  if (pattern === pathname) return true;
  const p = pattern.split("/").filter(Boolean);
  const a = pathname.split("/").filter(Boolean);
  const optionalCatchAll = p.at(-1)?.startsWith("[[...");
  const catchAll = p.at(-1)?.startsWith("[...");
  if (!optionalCatchAll && !catchAll && p.length !== a.length) return false;
  if ((optionalCatchAll || catchAll) && a.length < p.length - 1) return false;
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith("[[...") || p[i].startsWith("[...")) return true;
    if (!segmentMatch(p[i], a[i] || "")) return false;
  }
  return true;
}

const candidates = [];
const literalPatterns = [
  /\bhref\s*=\s*["'](\/[^"]*?)["']/g,
  /\bhref\s*:\s*["'](\/[^"]*?)["']/g,
  /(?:window\.)?location\.(?:href\s*=|replace\()\s*["'](\/[^"]*?)["']/g,
];

for (const file of files.filter((file) => /\.(tsx|ts)$/.test(file))) {
  const source = fs.readFileSync(file, "utf8");
  for (const regex of literalPatterns) {
    for (const match of source.matchAll(regex)) {
      const raw = match[1];
      if (!raw || raw.startsWith("//")) continue;
      const pathname = raw.split(/[?#]/, 1)[0] || "/";
      if (pathname.startsWith("/api/")) continue;
      candidates.push({ file: path.relative(root, file), raw, pathname });
    }
  }
}

const unique = new Map();
for (const candidate of candidates) unique.set(`${candidate.file}::${candidate.raw}`, candidate);

const errors = [];
for (const candidate of unique.values()) {
  if (!routes.some((route) => routeMatches(route, candidate.pathname))) {
    errors.push(`${candidate.file}: '${candidate.raw}' har ingen matchende side`);
  }
}

if (errors.length) {
  console.error(`Navigation validation failed with ${errors.length} broken static route(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Navigation validation passed: ${unique.size} static internal links checked against ${routes.length} app routes.`);
