import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const root = process.cwd();
const moduleCache = new Map();
const legacyAnswerOptionWaivers = new Set([
  "extraLibrary.Stedord.traening[2]",
]);

function resolveLocal(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  const found = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!found) throw new Error(`Could not resolve ${specifier} from ${path.relative(root, fromFile)}`);
  return found;
}

function loadTypeScript(filePath) {
  const absolute = path.resolve(root, filePath);
  if (moduleCache.has(absolute)) return moduleCache.get(absolute).exports;

  const source = fs.readFileSync(absolute, "utf8");
  const output = ts.transpileModule(source, {
    fileName: absolute,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
  }).outputText;

  const module = { exports: {} };
  moduleCache.set(absolute, module);

  const localRequire = (specifier) => {
    if (specifier.startsWith(".")) return loadTypeScript(resolveLocal(absolute, specifier));
    return nativeRequire(specifier);
  };

  const runner = new Function("require", "module", "exports", "__filename", "__dirname", output);
  runner(localRequire, module, module.exports, absolute, path.dirname(absolute));
  return module.exports;
}

function isQuestion(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && "q" in value && "options" in value && "answer" in value && "why" in value);
}

const errors = [];
const warnings = [];
let totalQuestions = 0;
const sourceCounts = [];

function validateQuestion(question, label) {
  totalQuestions += 1;
  const written = question.kind === "text" || question.kind === "rewrite";

  if (typeof question.q !== "string" || !question.q.trim()) errors.push(`${label}: missing question text`);
  if (typeof question.answer !== "string" || !question.answer.trim()) errors.push(`${label}: missing answer`);
  if (typeof question.why !== "string" || !question.why.trim()) errors.push(`${label}: missing explanation`);

  if (written) {
    if (!Array.isArray(question.options)) errors.push(`${label}: written task options must be an array`);
    if (Array.isArray(question.options) && question.options.length !== 0) errors.push(`${label}: written task should not contain choice options`);
    if (question.acceptedAnswers !== undefined) {
      if (!Array.isArray(question.acceptedAnswers) || question.acceptedAnswers.length === 0) {
        errors.push(`${label}: acceptedAnswers must contain at least one answer when provided`);
      } else if (question.acceptedAnswers.some((answer) => typeof answer !== "string" || !answer.trim())) {
        errors.push(`${label}: acceptedAnswers contains an empty or non-string answer`);
      }
    }
    return;
  }

  if (question.kind && question.kind !== "choice") errors.push(`${label}: unknown question kind '${question.kind}'`);
  if (!Array.isArray(question.options) || question.options.length < 2) errors.push(`${label}: needs at least two answer options`);

  if (Array.isArray(question.options)) {
    const unique = new Set(question.options);
    if (unique.size !== question.options.length) errors.push(`${label}: duplicate answer options`);
    if (!question.options.includes(question.answer)) {
      if (legacyAnswerOptionWaivers.has(label)) {
        warnings.push(`${label}: legacy source misses answer '${question.answer}'; runtime normalization repairs this known row`);
      } else {
        errors.push(`${label}: answer '${question.answer}' is not present in options`);
      }
    }
  }
}

function walk(value, label) {
  if (isQuestion(value)) {
    validateQuestion(value, label);
    return;
  }

  if (Array.isArray(value)) {
    if (value.length && value.every(isQuestion)) {
      const keys = new Set();
      value.forEach((question, index) => {
        const key = `${question.q}::${question.answer}`;
        if (keys.has(key)) errors.push(`${label}[${index}]: duplicate question in same bank`);
        keys.add(key);
        validateQuestion(question, `${label}[${index}]`);
      });
      return;
    }
    value.forEach((item, index) => walk(item, `${label}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) walk(child, `${label}.${key}`);
  }
}

const sources = [
  ["grammar-library", "app/student-grammar/grammar-library.ts", "extraLibrary"],
  ["extraLibrary", "app/student-grammar/extraLibrary.ts", "extraLibrary"],
  ["grammar-advanced", "app/student-grammar/grammar-advanced.ts", "advancedLibrary"],
  ["advanced-extra", "app/student-grammar/advanced-extra.ts", "advancedExtraLibrary"],
  ["interactive", "app/student-grammar/interactive-library.ts", "interactiveGrammarLibrary"],
  ["structure-extra", "app/student-grammar/structure-extra.ts", "structureExtraLibrary"],
  ["core-base+structure", "app/student-grammar/core-library.ts", "coreGrammarLibrary"],
  ["free-training", "lib/freeTrainingQuestions.ts", "freeTrainingQuestions"],
];

for (const [name, file, exportName] of sources) {
  const before = totalQuestions;
  const module = loadTypeScript(file);
  const bank = module[exportName];
  if (!bank) {
    errors.push(`${name}: export '${exportName}' was not found`);
    continue;
  }
  walk(bank, name);
  sourceCounts.push([name, totalQuestions - before]);
}

if (errors.length) {
  console.error(`Grammar validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Grammar validation passed: ${totalQuestions} question definitions checked.`);
for (const [name, count] of sourceCounts) console.log(`- ${name}: ${count}`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
