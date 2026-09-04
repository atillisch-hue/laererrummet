import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {createClient} from "@supabase/supabase-js";

const PROJECT_REF="jxmxiaiagknlvfxkluzu";
const dbUrl=process.env.SUPABASE_DB_URL;
const supabaseUrl=process.env.SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const root=path.resolve(process.env.KLASSEVAERELSET_BACKUP_ROOT||"backups/supabase");
const stamp=new Date().toISOString().replace(/[:.]/g,"-");
const dir=path.join(root,stamp);
const npx=process.platform==="win32"?"npx.cmd":"npx";

if(!dbUrl){
 console.error("Missing SUPABASE_DB_URL. Use the Session Pooler connection string and keep it out of Git/chat.");
 process.exit(1);
}
if(!dbUrl.includes(PROJECT_REF)){
 console.error(`SUPABASE_DB_URL does not look like the Klasseværelset project (${PROJECT_REF}). Aborting.`);
 process.exit(1);
}

fs.mkdirSync(dir,{recursive:true});

function runDump(file,extra=[]){
 const output=path.join(dir,file);
 const args=["--yes","supabase","db","dump","--db-url",dbUrl,"-f",output,...extra];
 const result=spawnSync(npx,args,{stdio:"inherit",env:process.env});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(`Backup command failed for ${file} (exit ${result.status}).`);
}

function safePart(value){return value.replace(/[^a-zA-Z0-9._-]/g,"_")}
function safeObjectPath(value){
 const parts=value.split("/").filter(Boolean).map(safePart);
 if(!parts.length)throw new Error("Invalid storage object path.");
 return path.join(...parts);
}

async function listStorageFiles(client,bucket,prefix=""){
 const rows=[];
 for(let offset=0;;offset+=1000){
  const{data,error}=await client.storage.from(bucket).list(prefix,{limit:1000,offset,sortBy:{column:"name",order:"asc"}});
  if(error)throw new Error(`Could not list storage bucket ${bucket}: ${error.message}`);
  const batch=data||[];
  for(const item of batch){
   const full=prefix?`${prefix}/${item.name}`:item.name;
   if(item.id||item.metadata)rows.push(full);
   else rows.push(...await listStorageFiles(client,bucket,full));
  }
  if(batch.length<1000)break;
 }
 return rows;
}

async function backupStorage(){
 if(!supabaseUrl||!serviceRoleKey){
  return{status:"skipped",reason:"SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY were not supplied",buckets:[]};
 }
 if(!supabaseUrl.includes(PROJECT_REF))throw new Error("SUPABASE_URL is not the Klasseværelset project. Aborting storage export.");
 const client=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const{data:buckets,error}=await client.storage.listBuckets();
 if(error)throw new Error(`Could not list storage buckets: ${error.message}`);
 const result=[];
 for(const bucket of buckets||[]){
  const names=await listStorageFiles(client,bucket.id);
  const bucketRoot=path.join(dir,"storage",safePart(bucket.id));
  fs.mkdirSync(bucketRoot,{recursive:true});
  for(const name of names){
   const{data,error:downloadError}=await client.storage.from(bucket.id).download(name);
   if(downloadError)throw new Error(`Could not download ${bucket.id}/${name}: ${downloadError.message}`);
   const target=path.join(bucketRoot,safeObjectPath(name));
   fs.mkdirSync(path.dirname(target),{recursive:true});
   fs.writeFileSync(target,Buffer.from(await data.arrayBuffer()));
  }
  result.push({id:bucket.id,public:bucket.public,objects:names.length});
 }
 return{status:"complete",buckets:result};
}

function filesRecursively(directory){
 if(!fs.existsSync(directory))return[];
 return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  const full=path.join(directory,entry.name);
  return entry.isDirectory()?filesRecursively(full):[full];
 });
}
function sha256(file){
 const hash=crypto.createHash("sha256");
 hash.update(fs.readFileSync(file));
 return hash.digest("hex");
}

try{
 console.log(`Creating Klasseværelset backup in ${dir}`);
 runDump("roles.sql",["--role-only"]);
 runDump("schema.sql");
 runDump("data.sql",["--use-copy","--data-only","-x","storage.buckets_vectors","-x","storage.vector_indexes"]);
 runDump("migration-history-schema.sql",["--schema","supabase_migrations"]);
 runDump("migration-history-data.sql",["--use-copy","--data-only","--schema","supabase_migrations"]);
 const storage=await backupStorage();
 const files=filesRecursively(dir).filter(f=>path.basename(f)!=="manifest.json").map(file=>({
  path:path.relative(dir,file).replaceAll("\\","/"),
  bytes:fs.statSync(file).size,
  sha256:sha256(file)
 }));
 const manifest={
  format_version:1,
  project_ref:PROJECT_REF,
  created_at:new Date().toISOString(),
  storage,
  files
 };
 fs.writeFileSync(path.join(dir,"manifest.json"),JSON.stringify(manifest,null,2));
 console.log(`Backup complete: ${files.length} files. Run npm run backup:verify -- "${dir}".`);
 if(storage.status!=="complete")console.warn("Storage objects were NOT exported. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for a complete database + Storage backup.");
}catch(error){
 console.error(error instanceof Error?error.message:String(error));
 process.exit(1);
}
