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
function safeResolved(relative){
 const file=path.resolve(dir,relative);
 return file.startsWith(dir+path.sep)?file:null;
}
function sha256(file){const h=crypto.createHash("sha256");h.update(fs.readFileSync(file));return h.digest("hex")}
const manifestFiles=new Set();
for(const item of manifest.files||[]){
 manifestFiles.add(item.path);
 const file=safeResolved(item.path);
 if(!file){errors.push(`${item.path}: unsafe path`);continue}
 if(!fs.existsSync(file)){errors.push(`${item.path}: missing`);continue}
 const bytes=fs.statSync(file).size;
 if(bytes!==item.bytes)errors.push(`${item.path}: size mismatch`);
 const hash=sha256(file);
 if(hash!==item.sha256)errors.push(`${item.path}: SHA-256 mismatch`);
}

const storageStatus=manifest.storage?.status||"unknown";
if(storageStatus==="complete"){
 const buckets=Array.isArray(manifest.storage?.buckets)?manifest.storage.buckets:[];
 if(Number(manifest.format_version||1)>=2){
  const seen=new Set();
  for(const bucket of buckets){
   if(!bucket?.id){errors.push("Storage bucket is missing id");continue}
   if(!Array.isArray(bucket.objects)){errors.push(`${bucket.id}: object mapping is missing`);continue}
   for(const object of bucket.objects){
    if(!object?.path||!object?.file){errors.push(`${bucket.id}: invalid object mapping`);continue}
    const key=`${bucket.id}/${object.path}`;
    if(seen.has(key))errors.push(`${key}: duplicate object mapping`);
    seen.add(key);
    if(!manifestFiles.has(object.file))errors.push(`${key}: mapped backup file is missing from manifest`);
    const file=safeResolved(object.file);
    if(!file)errors.push(`${key}: unsafe mapped file path`);
   }
  }
 }else{
  console.warn("Legacy Storage manifest detected. Files can be checksum-verified, but exact object-path restore requires a new format v2 backup.");
 }
}

if(errors.length){
 console.error("Backup verification failed:");
 for(const error of errors)console.error(`- ${error}`);
 process.exit(1);
}
console.log(`Backup verified: ${(manifest.files||[]).length} files match the manifest; database dump is complete; Storage status=${storageStatus}.`);
if(storageStatus!=="complete")console.warn("This backup does not contain a verified Storage-object export.");
