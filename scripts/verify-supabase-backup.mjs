import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dir=path.resolve(process.argv[2]||"");
if(!process.argv[2]||!fs.existsSync(dir)){
 console.error("Usage: npm run backup:verify -- <backup-directory>");
 process.exit(1);
}
const manifestPath=path.join(dir,"manifest.json");
if(!fs.existsSync(manifestPath)){
 console.error("manifest.json is missing from the backup directory.");
 process.exit(1);
}
const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
if(manifest.project_ref!=="jxmxiaiagknlvfxkluzu"){
 console.error("Backup manifest belongs to another Supabase project.");
 process.exit(1);
}
const required=["roles.sql","schema.sql","data.sql","migration-history-schema.sql","migration-history-data.sql"];
const errors=[];
for(const name of required){if(!fs.existsSync(path.join(dir,name)))errors.push(`${name} is missing`)}
function sha256(file){const h=crypto.createHash("sha256");h.update(fs.readFileSync(file));return h.digest("hex")}
for(const item of manifest.files||[]){
 const file=path.resolve(dir,item.path);
 if(!file.startsWith(dir+path.sep)&&file!==dir){errors.push(`${item.path}: unsafe path`);continue}
 if(!fs.existsSync(file)){errors.push(`${item.path}: missing`);continue}
 const bytes=fs.statSync(file).size;
 if(bytes!==item.bytes)errors.push(`${item.path}: size mismatch`);
 const hash=sha256(file);
 if(hash!==item.sha256)errors.push(`${item.path}: SHA-256 mismatch`);
}
if(errors.length){
 console.error("Backup verification failed:");
 for(const error of errors)console.error(`- ${error}`);
 process.exit(1);
}
const storage=manifest.storage?.status||"unknown";
console.log(`Backup verified: ${(manifest.files||[]).length} files match the manifest; database dump is complete; Storage status=${storage}.`);
if(storage!=="complete")console.warn("This backup does not contain a verified Storage-object export.");
