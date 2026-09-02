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

  if (question.minGrade !== undefined && (!Number.isInteger(question.minGrade) || question.minGrade < 0 || question.minGrade > 10)) {
    errors.push(`${label}: minGrade must be an integer from 0 to 10`);
  }
  if (question.maxGrade !== undefined && (!Number.isInteger(question.maxGrade) || question.maxGrade < 0 || question.maxGrade > 10)) {
    errors.push(`${label}: maxGrade must be an integer from 0 to 10`);
  }
  if (question.minGrade !== undefined && question.maxGrade !== undefined && question.minGrade > question.maxGrade) {
    errors.push(`${label}: minGrade cannot be higher than maxGrade`);
  }

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
  ["foundation", "app/student-grammar/foundation-library.ts", "foundationGrammarLibrary"],
  ["foundation-extra", "app/student-grammar/foundation-extra.ts", "foundationExtraGrammarLibrary"],
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

function uniqueQuestions(questions) {
  const byKey = new Map();
  for (const question of questions) byKey.set(`${question.q}::${question.answer}`, question);
  return Array.from(byKey.values());
}

function mergeLibraries(...libraries) {
  const result = {};
  for (const library of libraries) {
    for (const [topic, levels] of Object.entries(library)) {
      result[topic] ||= {};
      for (const [level, questions] of Object.entries(levels)) {
        result[topic][level] = uniqueQuestions([...(result[topic][level] || []), ...questions]);
      }
    }
  }
  return result;
}

function freeTrainingAsAssignedGrammar(freeTrainingQuestions) {
  const result = {};
  const subject = freeTrainingQuestions["dansk-grammatik"] || {};
  for (const area of Object.values(subject)) {
    for (const [topic, levels] of Object.entries(area)) {
      result[topic] ||= {};
      const basis = [...(levels.start || []), ...(levels.basis || [])];
      if (basis.length) result[topic].basis = basis;
      if (levels.traening?.length) result[topic].traening = levels.traening;
      if (levels.udfordring?.length) result[topic].udfordring = levels.udfordring;
    }
  }
  return result;
}

function validateGradeCoverage() {
  const progression = loadTypeScript("app/student-grammar/grade-progression.ts");
  const foundation = loadTypeScript("app/student-grammar/foundation-library.ts").foundationGrammarLibrary;
  const foundationExtra = loadTypeScript("app/student-grammar/foundation-extra.ts").foundationExtraGrammarLibrary;
  const core = loadTypeScript("app/student-grammar/core-library.ts").coreGrammarLibrary;
  const grammarLibrary = loadTypeScript("app/student-grammar/grammar-library.ts").extraLibrary;
  const expanded = loadTypeScript("app/student-grammar/extraLibrary.ts").extraLibrary;
  const advanced = loadTypeScript("app/student-grammar/grammar-advanced.ts").advancedLibrary;
  const advancedExtra = loadTypeScript("app/student-grammar/advanced-extra.ts").advancedExtraLibrary;
  const interactive = loadTypeScript("app/student-grammar/interactive-library.ts").interactiveGrammarLibrary;
  const freeTraining = loadTypeScript("lib/freeTrainingQuestions.ts").freeTrainingQuestions;

  const library = mergeLibraries(
    foundation,
    foundationExtra,
    progression.tagLibraryForGrades(core, 5),
    progression.tagLibraryForGrades(grammarLibrary, 5),
    progression.tagLibraryForGrades(expanded, 5),
    progression.tagLibraryForGrades(advanced, 7),
    progression.tagLibraryForGrades(advancedExtra, 5),
    progression.tagLibraryForGrades(interactive, 5),
    progression.tagLibraryForGrades(freeTrainingAsAssignedGrammar(freeTraining), 5),
  );

  const gradeLevelChecks = [
    { grade: 1, levels: ["basis"] },
    { grade: 2, levels: ["basis", "traening"] },
    { grade: 3, levels: ["basis", "traening", "udfordring"] },
    { grade: 4, levels: ["basis", "traening", "udfordring"] },
    { grade: 5, levels: ["basis", "traening", "udfordring"] },
    { grade: 6, levels: ["basis", "traening", "udfordring"] },
    { grade: 7, levels: ["basis", "traening", "udfordring"] },
    { grade: 8, levels: ["basis", "traening", "udfordring"] },
    { grade: 9, levels: ["basis", "traening", "udfordring"] },
    { grade: 10, levels: ["basis", "traening", "udfordring"] },
  ];

  const coverageRows = [];
  for (const { grade, levels } of gradeLevelChecks) {
    for (const [topic, topicLevels] of Object.entries(library)) {
      if (progression.minimumGradeForTopic(topic) > grade) continue;
      for (const level of levels) {
        const filtered = progression.filterLevelsForGrade(topicLevels, grade, level);
        const directPool = uniqueQuestions(filtered[level] || []);
        coverageRows.push({ grade, topic, level, count: directPool.length });
        if (directPool.length < 5) {
          errors.push(`coverage: ${grade}. klasse · ${topic} · ${level} has ${directPool.length} grade-appropriate question(s); minimum is 5`);
        }
      }
    }
  }

  if (!errors.some((error) => error.startsWith("coverage:"))) {
    const checked = coverageRows.length;
    const minimum = Math.min(...coverageRows.map((row) => row.count));
    console.log(`Grade coverage passed: ${checked} grade/topic/level combinations checked; minimum pool size ${minimum}.`);
  }
}

validateGradeCoverage();

if (errors.length) {
  console.error(`Grammar validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Grammar validation passed: ${totalQuestions} question definitions checked.`);
for (const [name, count] of sourceCounts) console.log(`- ${name}: ${count}`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
