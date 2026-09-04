import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

const PRODUCTION_REF="jxmxiaiagknlvfxkluzu";
const dir=path.resolve(process.argv[2]||"");
const target=process.env.RESTORE_DB_URL;
const confirmed=process.env.KLASSEVAERELSET_RESTORE_TEST==="YES";
const psql=process.platform==="win32"?"psql.exe":"psql";

if(!process.argv[2]||!fs.existsSync(dir)){
 console.error("Usage: npm run restore:test -- <backup-directory>");
 process.exit(1);
}
if(!target){console.error("Missing RESTORE_DB_URL for a disposable/local restore target.");process.exit(1)}
if(!confirmed){console.error("Set KLASSEVAERELSET_RESTORE_TEST=YES to confirm this is a disposable restore target.");process.exit(1)}
if(target.includes(PRODUCTION_REF)){
 console.error("REFUSING RESTORE: RESTORE_DB_URL points at the Klasseværelset production project.");
 process.exit(1);
}
for(const name of ["roles.sql","schema.sql","data.sql"]){
 if(!fs.existsSync(path.join(dir,name))){console.error(`${name} is missing.`);process.exit(1)}
}

const verify=spawnSync(process.execPath,[path.resolve("scripts/verify-supabase-backup.mjs"),dir],{stdio:"inherit"});
if(verify.status!==0)process.exit(verify.status||1);

const args=[
 "--single-transaction",
 "--variable","ON_ERROR_STOP=1",
 "--file",path.join(dir,"roles.sql"),
 "--file",path.join(dir,"schema.sql"),
 "--command","SET session_replication_role = replica",
 "--file",path.join(dir,"data.sql"),
 "--dbname",target
];
console.log("Restoring database backup into the explicitly confirmed NON-PRODUCTION target…");
const result=spawnSync(psql,args,{stdio:"inherit",env:process.env});
if(result.error){console.error(result.error.message);process.exit(1)}
if(result.status!==0){console.error(`Restore failed with exit ${result.status}.`);process.exit(result.status||1)}

if(fs.existsSync(path.join(dir,"migration-history-schema.sql"))&&fs.existsSync(path.join(dir,"migration-history-data.sql"))){
 const history=spawnSync(psql,[
  "--single-transaction","--variable","ON_ERROR_STOP=1",
  "--file",path.join(dir,"migration-history-schema.sql"),
  "--file",path.join(dir,"migration-history-data.sql"),
  "--dbname",target
 ],{stdio:"inherit",env:process.env});
 if(history.status!==0){console.error("Database restored, but migration-history restore failed.");process.exit(history.status||1)}
}

const smokeSql=[
 "select count(*) from public.schools;",
 "select count(*) from public.school_memberships;",
 "select count(*) from public.classes;",
 "select count(*) from public.schedule_entries;",
 "select count(*) from public.students;"
].join(" ");
const smoke=spawnSync(psql,["--variable","ON_ERROR_STOP=1","--command",smokeSql,"--dbname",target],{stdio:"inherit",env:process.env});
if(smoke.status!==0){console.error("Restore completed but smoke verification failed.");process.exit(smoke.status||1)}
console.log("Restore test passed: core Klasseværelset tables are queryable on the non-production target.");
console.log("Storage objects are a separate restore step and are not uploaded by this database restore test.");
