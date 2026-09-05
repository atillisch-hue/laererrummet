import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const root = process.cwd();
const moduleCache = new Map();

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
  const localRequire = (specifier) => specifier.startsWith(".")
    ? loadTypeScript(resolveLocal(absolute, specifier))
    : nativeRequire(specifier);
  const runner = new Function("require", "module", "exports", "__filename", "__dirname", output);
  runner(localRequire, module, module.exports, absolute, path.dirname(absolute));
  return module.exports;
}

const { prepareAdaptiveRetry, questionKey } = loadTypeScript("app/student-grammar/round-selection.ts");

function question(index) {
  return {
    q: `Testspørgsmål ${index}`,
    options: [`Svar ${index}`, `Forkert ${index}`],
    answer: `Svar ${index}`,
    why: `Forklaring ${index}`,
    kind: "choice",
  };
}

const questions = Array.from({ length: 12 }, (_, index) => question(index + 1));
const topicLevels = {
  basis: questions.slice(0, 6),
  traening: questions.slice(6, 10),
  udfordring: questions.slice(10),
};
const allSeen = new Set(questions.map(questionKey));
const lastRound = new Set(questions.slice(0, 5).map(questionKey));

for (let run = 0; run < 50; run += 1) {
  const next = prepareAdaptiveRetry(topicLevels.basis, topicLevels, "basis", 2, allSeen, lastRound);
  const keys = next.map(questionKey);
  if (keys.length !== 5) throw new Error(`Retry returned ${keys.length} questions instead of 5.`);
  if (new Set(keys).size !== keys.length) throw new Error("Retry returned duplicate questions in the same round.");
  if (keys.some((key) => lastRound.has(key))) {
    throw new Error("Retry repeated a question from the immediately previous round despite enough alternatives.");
  }
}

console.log("Grammar retry validation passed: the previous round is avoided when five alternatives exist.");
