import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {createClient} from "@supabase/supabase-js";

const PRODUCTION_REF="jxmxiaiagknlvfxkluzu";
const dir=path.resolve(process.argv[2]||"");
const targetUrl=process.env.RESTORE_SUPABASE_URL;
const serviceRoleKey=process.env.RESTORE_SUPABASE_SERVICE_ROLE_KEY;
const confirmed=process.env.KLASSEVAERELSET_RESTORE_STORAGE_TEST==="YES";

if(!process.argv[2]||!fs.existsSync(dir)){
 console.error("Usage: npm run restore:storage:test -- <backup-directory>");
 process.exit(1);
}
if(!targetUrl||!serviceRoleKey){
 console.error("Missing RESTORE_SUPABASE_URL or RESTORE_SUPABASE_SERVICE_ROLE_KEY for the disposable test project.");
 process.exit(1);
}
if(!confirmed){
 console.error("Set KLASSEVAERELSET_RESTORE_STORAGE_TEST=YES to confirm this is a disposable Storage restore target.");
 process.exit(1);
}
if(targetUrl.includes(PRODUCTION_REF)){
 console.error("REFUSING STORAGE RESTORE: RESTORE_SUPABASE_URL points at the Klasseværelset production project.");
 process.exit(1);
}

const verify=spawnSync(process.execPath,[path.resolve("scripts/verify-supabase-backup.mjs"),dir],{stdio:"inherit"});
if(verify.status!==0)process.exit(verify.status||1);

const manifest=JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8"));
if(Number(manifest.format_version||1)<2){
 console.error("Storage restore requires a format v2 backup with exact object-path mappings. Create a fresh backup first.");
 process.exit(1);
}
if(manifest.storage?.status!=="complete"){
 console.error("Storage restore requires a backup whose Storage status is complete.");
 process.exit(1);
}

function safeResolved(relative){
 const file=path.resolve(dir,relative);
 if(!file.startsWith(dir+path.sep))throw new Error(`Unsafe backup path: ${relative}`);
 return file;
}
function sha256Buffer(buffer){return crypto.createHash("sha256").update(buffer).digest("hex")}
async function listPaths(client,bucket,prefix=""){
 const rows=[];
 for(let offset=0;;offset+=1000){
  const{data,error}=await client.storage.from(bucket).list(prefix,{limit:1000,offset,sortBy:{column:"name",order:"asc"}});
  if(error)throw new Error(`Could not list target bucket ${bucket}: ${error.message}`);
  const batch=data||[];
  for(const item of batch){
   const full=prefix?`${prefix}/${item.name}`:item.name;
   if(item.id||item.metadata)rows.push(full);
   else rows.push(...await listPaths(client,bucket,full));
  }
  if(batch.length<1000)break;
 }
 return rows;
}
function bucketOptions(bucket){
 const options={public:!!bucket.public};
 if(bucket.file_size_limit!==null&&bucket.file_size_limit!==undefined)options.fileSizeLimit=bucket.file_size_limit;
 if(Array.isArray(bucket.allowed_mime_types))options.allowedMimeTypes=bucket.allowed_mime_types;
 return options;
}

try{
 const client=createClient(targetUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const{data:existingBuckets,error:listError}=await client.storage.listBuckets();
 if(listError)throw new Error(`Could not list target Storage buckets: ${listError.message}`);
 const existing=new Map((existingBuckets||[]).map(bucket=>[bucket.id,bucket]));

 let restored=0;
 for(const bucket of manifest.storage.buckets||[]){
  if(!bucket?.id||!Array.isArray(bucket.objects))throw new Error("Invalid Storage bucket mapping in manifest.");
  if(existing.has(bucket.id)){
   const{error}=await client.storage.updateBucket(bucket.id,bucketOptions(bucket));
   if(error)throw new Error(`Could not align target bucket ${bucket.id}: ${error.message}`);
  }else{
   const{error}=await client.storage.createBucket(bucket.id,bucketOptions(bucket));
   if(error)throw new Error(`Could not create target bucket ${bucket.id}: ${error.message}`);
  }

  const sourcePaths=new Set(bucket.objects.map(object=>object.path));
  const before=await listPaths(client,bucket.id);
  const extras=before.filter(objectPath=>!sourcePaths.has(objectPath));
  if(extras.length){
   throw new Error(`Target bucket ${bucket.id} is not disposable/clean: ${extras.length} extra object(s) are present.`);
  }

  for(const object of bucket.objects){
   const source=safeResolved(object.file);
   const bytes=fs.readFileSync(source);
   const uploadOptions={upsert:true};
   if(object.content_type)uploadOptions.contentType=object.content_type;
   if(object.cache_control)uploadOptions.cacheControl=String(object.cache_control);
   const{error}=await client.storage.from(bucket.id).upload(object.path,bytes,uploadOptions);
   if(error)throw new Error(`Could not restore ${bucket.id}/${object.path}: ${error.message}`);

   const{data,error:downloadError}=await client.storage.from(bucket.id).download(object.path);
   if(downloadError)throw new Error(`Could not verify restored ${bucket.id}/${object.path}: ${downloadError.message}`);
   const restoredBytes=Buffer.from(await data.arrayBuffer());
   if(sha256Buffer(restoredBytes)!==sha256Buffer(bytes))throw new Error(`Checksum mismatch after restoring ${bucket.id}/${object.path}.`);
   restored++;
  }

  const after=new Set(await listPaths(client,bucket.id));
  for(const expected of sourcePaths){if(!after.has(expected))throw new Error(`Restored object is missing from target listing: ${bucket.id}/${expected}`)}
  const afterExtras=[...after].filter(objectPath=>!sourcePaths.has(objectPath));
  if(afterExtras.length)throw new Error(`Target bucket ${bucket.id} contains unexpected objects after restore.`);
 }
 console.log(`Storage restore test passed: ${restored} object(s) restored and checksum-verified on the NON-PRODUCTION target.`);
}catch(error){
 console.error(error instanceof Error?error.message:String(error));
 process.exit(1);
}
