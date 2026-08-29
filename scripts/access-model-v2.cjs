const Database=require("better-sqlite3"),fs=require("fs"),path=require("path");
(async()=>{
 const dbPath=path.join(process.cwd(),"data","rkn-erp.sqlite");
 if(!fs.existsSync(dbPath)) throw new Error("DB_NOT_FOUND");
 const db=new Database(dbPath); db.pragma("foreign_keys = ON"); db.pragma("busy_timeout = 5000");
 try{
  const stamp=new Date().toISOString().replaceAll(":","-").replaceAll(".","-");
  const dir=path.join(process.cwd(),"data","private"); fs.mkdirSync(dir,{recursive:true});
  const backup=path.join(dir,"rkn-erp-before-access-v2-"+stamp+".sqlite"); await db.backup(backup); console.log("BACKUP_OK="+backup);
  const now=new Date().toISOString();
  const cols=t=>new Set(db.prepare("PRAGMA table_info("+t+")").all().map(r=>r.name));
  const ins=(t,o)=>{const c=cols(t),e=Object.entries(o).filter(([k,v])=>c.has(k)&&v!==undefined),n=e.map(([k])=>k);db.prepare("INSERT INTO "+t+" ("+n.join(",")+") VALUES ("+n.map(()=>"?").join(",")+")").run(...e.map(([,v])=>v));};
  const role=c=>db.prepare("SELECT * FROM role WHERE code=? LIMIT 1").get(c);
  const perm=c=>db.prepare("SELECT * FROM permission WHERE code=? LIMIT 1").get(c);
  const ensureRole=()=>{let r=role("RKN_PAYROLL_OFFICER");if(r)return r;ins("role",{id:"ROLE-RKN-PAYROLL-OFFICER",code:"RKN_PAYROLL_OFFICER",name:"RKN Payroll Officer",scope_type:"UNIT",scope:"UNIT",active:1,created_at:now,updated_at:now});return role("RKN_PAYROLL_OFFICER");};
  const ensurePerm=(id,code,module,name,description)=>{let p=perm(code);if(p)return p;ins("permission",{id,code,module,name,description,active:1,created_at:now,updated_at:now});return perm(code);};
  const rp=(r,p,id)=>{if(!db.prepare("SELECT 1 FROM role_permission WHERE role_id=? AND permission_id=? LIMIT 1").get(r,p))ins("role_permission",{id,role_id:r,permission_id:p,created_at:now,updated_at:now});};
  const ur=(u,r,b,id)=>{if(!db.prepare("SELECT 1 FROM user_role WHERE user_id=? AND role_id=? AND business_unit_id=? LIMIT 1").get(u,r,b))ins("user_role",{id,user_id:u,role_id:r,business_unit_id:b,created_at:now,updated_at:now});};
  const admin=role("SYSTEM_ADMIN"),fatur=db.prepare("SELECT id FROM user WHERE username=? LIMIT 1").get("fatur"),bu=db.prepare("SELECT id FROM business_unit WHERE id=? LIMIT 1").get("BU-RKN"),pv=perm("payroll.view"),pe=perm("payroll.entry");
  if(!admin||!fatur||!bu||!pv||!pe) throw new Error("PRECHECK_FAILED");
  const bad=db.prepare("SELECT p.code FROM role_permission rp JOIN permission p ON p.id=rp.permission_id WHERE rp.role_id=? AND p.code IN (?,?,?,?)").all(admin.id,"payroll.entry","payroll.approve","payroll.reopen","payroll.mark_paid");
  if(bad.length) throw new Error("SYSTEM_ADMIN_MUTATION_ALREADY_PRESENT:"+bad.map(x=>x.code).join(","));
  db.transaction(()=>{
   const rr=ensureRole(); if(!rr) throw new Error("RKN_PAYROLL_ROLE_FAILED");
   const p1=ensurePerm("PERM-SYSTEM-VIEW-WORKSPACES","system.view_workspaces","SYSTEM","View All Workspaces","Global workspace visibility without business ownership.");
   const p2=ensurePerm("PERM-SYSTEM-VIEW-ALL-BUSINESS-DATA","system.view_all_business_data","SYSTEM","View All Business Data","Read-only observer access across business units.");
   const p3=ensurePerm("PERM-PAYROLL-PAYSLIP-SEND","payroll.payslip.send","PAYROLL","Send Payroll Payslip","Send payslips through approved integration channels such as WhatsApp API.");
   rp(admin.id,p1.id,"RP-SYSADMIN-VIEW-WORKSPACES"); rp(admin.id,p2.id,"RP-SYSADMIN-VIEW-ALL-BUSINESS-DATA"); rp(admin.id,p3.id,"RP-SYSADMIN-PAYSLIP-SEND");
   rp(rr.id,pv.id,"RP-RKN-PAYROLL-VIEW"); rp(rr.id,pe.id,"RP-RKN-PAYROLL-ENTRY"); ur(fatur.id,rr.id,bu.id,"UR-FATUR-RKN-PAYROLL-OFFICER");
  })();
  const has=(r,p)=>!!db.prepare("SELECT 1 FROM role r JOIN role_permission rp ON rp.role_id=r.id JOIN permission p ON p.id=rp.permission_id WHERE r.code=? AND p.code=? LIMIT 1").get(r,p);
  const fr=!!db.prepare("SELECT 1 FROM user_role ur JOIN user u ON u.id=ur.user_id JOIN role r ON r.id=ur.role_id WHERE u.username=? AND r.code=? AND ur.business_unit_id=? LIMIT 1").get("fatur","RKN_PAYROLL_OFFICER","BU-RKN");
  console.log("ACCESS_MODEL_V2_OK"); console.log("FATUR_RKN_PAYROLL_ROLE="+fr); console.log("SYSTEM_ADMIN_OBSERVER="+(has("SYSTEM_ADMIN","system.view_workspaces")&&has("SYSTEM_ADMIN","system.view_all_business_data"))); console.log("SYSTEM_ADMIN_PAYSLIP_SEND="+has("SYSTEM_ADMIN","payroll.payslip.send")); console.log("SYSTEM_ADMIN_PAYROLL_ENTRY="+has("SYSTEM_ADMIN","payroll.entry")); console.log("RKN_PAYROLL_VIEW="+has("RKN_PAYROLL_OFFICER","payroll.view")); console.log("RKN_PAYROLL_ENTRY="+has("RKN_PAYROLL_OFFICER","payroll.entry")); console.log("RKN_PAYROLL_APPROVE="+has("RKN_PAYROLL_OFFICER","payroll.approve"));
 }finally{db.close();}
})().catch(e=>{console.error("ACCESS_MODEL_V2_FAILED="+e.message);process.exitCode=1;});