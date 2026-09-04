import fs from "node:fs";
import path from "node:path";

const directory = path.resolve("supabase/migrations");
if (!fs.existsSync(directory)) {
  console.error("Missing supabase/migrations directory.");
  process.exit(1);
}

const files = fs.readdirSync(directory).filter(name => name.endsWith(".sql")).sort();
if (!files.length) {
  console.error("No Supabase migrations found.");
  process.exit(1);
}

const errors = [];
const warnings = [];
const versions = new Map();

for (const file of files) {
  const modern = file.match(/^(\d{14})_([a-z0-9_]+)\.sql$/);
  const legacy = file.match(/^(\d{8})_([a-z0-9_]+)\.sql$/);

  if (!modern && !legacy) {
    errors.push(`${file}: migration names must be YYYYMMDDHHMMSS_snake_case.sql`);
    continue;
  }

  const version = (modern || legacy)[1];
  if (versions.has(version)) {
    errors.push(`${file}: duplicate migration version ${version} (also used by ${versions.get(version)})`);
  } else {
    versions.set(version, file);
  }

  if (legacy) {
    if (Number(version) > 20260831) {
      errors.push(`${file}: new migrations must use the 14-digit Supabase version.`);
    } else {
      warnings.push(`${file}: legacy 8-digit migration retained for history; do not copy this naming style.`);
    }
  }

  const sql = fs.readFileSync(path.join(directory, file), "utf8").trim();
  if (!sql) errors.push(`${file}: migration is empty.`);
}

if (warnings.length) {
  console.warn("Migration warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error("Migration validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Migration validation passed: ${files.length} SQL migrations checked; versions are unique and naming is controlled.`);
