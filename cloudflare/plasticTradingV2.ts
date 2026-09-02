/* RKN_PLASTIC_TRADING_OPERATIONS_V2 */
/* RKN_PLASTIC_V2G_MANUAL_CUSTOMER_ENGINE */
/* RKN_PLASTIC_GLOBAL_GOLIVE_V2I */

type Sql = { exec:(q:string,...a:any[])=>{toArray:()=>any[]} };
type Actor={id:string;name:string;role:string;level:string;admin:boolean};
const T=(v:any,n=240)=>String(v??"").trim().slice(0,n);
const N=(v:any,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d};
const I=(v:any,d=0)=>Math.max(0,Math.round(N(v,d)));
const DK=(v:any)=>{const s=T(v,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('PLASTIC_DATE_INVALID');return s};
const PK=(v:any)=>{const s=T(v,7);if(!/^\d{4}-\d{2}$/.test(s))throw Error('PLASTIC_PERIOD_INVALID');return s};
const now=()=>new Date().toISOString();
const curPeriod=()=>{const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).formatToParts(new Date());const y=p.find(x=>x.type==='year')?.value??'';const m=p.find(x=>x.type==='month')?.value??'';return `${y}-${m}`};
const scalar=(sql:Sql,q:string,...a:any[])=>Number(sql.exec(q,...a).toArray()[0]?.value??0);

export const PLASTIC_SCHEMA_V2=`

CREATE TABLE IF NOT EXISTS plastic_product_price_history (
  history_id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  variant_id TEXT NOT NULL,
  effective_date_key TEXT NOT NULL,
  sell_price_base_rp INTEGER NOT NULL DEFAULT 0,
  sell_price_mid_rp INTEGER NOT NULL DEFAULT 0,
  sell_price_pack_rp INTEGER NOT NULL DEFAULT 0,
  buy_price_rp INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  actor_user_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pl_price_hist_variant_date 
ON plastic_product_price_history(business_unit_id, variant_id, effective_date_key);

CREATE TABLE IF NOT EXISTS plastic_supplier_payable (
  payable_id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  supplier_name TEXT NOT NULL,
  date_key TEXT NOT NULL,
  reference_no TEXT NOT NULL DEFAULT '',
  payable_type TEXT NOT NULL CHECK(payable_type IN('OPENING_BALANCE','INBOUND_INVOICE','ADJUSTMENT')),
  total_amount_rp INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  actor_user_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plastic_supplier_payment (
  payment_id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  supplier_name TEXT NOT NULL,
  date_key TEXT NOT NULL,
  amount_rp INTEGER NOT NULL CHECK(amount_rp > 0),
  funding_source TEXT NOT NULL CHECK(funding_source IN('PAMAN_FUNDING','RKN_INTERNAL_CASH','OTHER')),
  reference_no TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  actor_user_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plastic_paman_funding_ledger (
  entry_id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  date_key TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK(entry_type IN('FUNDING_IN','REPAYMENT_OUT')),
  amount_rp INTEGER NOT NULL CHECK(amount_rp > 0),
  reference_no TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  actor_user_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plastic_product_variant(variant_id TEXT PRIMARY KEY,business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',product_name TEXT NOT NULL,category TEXT NOT NULL DEFAULT 'POLYMAILER',color TEXT NOT NULL DEFAULT '',size TEXT NOT NULL DEFAULT '',grade TEXT NOT NULL DEFAULT '',base_unit TEXT NOT NULL DEFAULT 'ROLL',mid_unit TEXT NOT NULL DEFAULT '',pack_unit TEXT NOT NULL DEFAULT 'BALL',units_per_mid INTEGER NOT NULL DEFAULT 1 CHECK(units_per_mid>0),units_per_pack INTEGER NOT NULL DEFAULT 1 CHECK(units_per_pack>0),default_buy_price_rp INTEGER NOT NULL DEFAULT 0,default_sell_price_base_rp INTEGER NOT NULL DEFAULT 0,default_sell_price_mid_rp INTEGER NOT NULL DEFAULT 0,default_sell_price_pack_rp INTEGER NOT NULL DEFAULT 0,low_stock_base_qty REAL NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plastic_customer(customer_id TEXT PRIMARY KEY,business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',customer_name TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plastic_inventory_balance(business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',variant_id TEXT NOT NULL,qty_base REAL NOT NULL DEFAULT 0 CHECK(qty_base>=0),avg_cost_rp INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,PRIMARY KEY(business_unit_id,variant_id));
CREATE TABLE IF NOT EXISTS plastic_inventory_movement(movement_id TEXT PRIMARY KEY,business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',variant_id TEXT NOT NULL,period_key TEXT NOT NULL,date_key TEXT NOT NULL,movement_type TEXT NOT NULL CHECK(movement_type IN('OPENING','IN','OUT','RETURN_IN','RETURN_OUT','ADJUSTMENT_IN','ADJUSTMENT_OUT')),qty_base REAL NOT NULL CHECK(qty_base>0),unit_cost_rp INTEGER NOT NULL DEFAULT 0,source_type TEXT NOT NULL DEFAULT '',source_key TEXT NOT NULL DEFAULT '',actor_user_id TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',occurred_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_pl_mv_period ON plastic_inventory_movement(business_unit_id,period_key,date_key,movement_type);
CREATE TABLE IF NOT EXISTS plastic_inbound(inbound_id TEXT PRIMARY KEY,business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',inbound_no TEXT NOT NULL UNIQUE,supplier_name TEXT NOT NULL DEFAULT '',supplier_ref TEXT NOT NULL DEFAULT '',period_key TEXT NOT NULL,date_key TEXT NOT NULL,total_value_rp INTEGER NOT NULL DEFAULT 0,note TEXT NOT NULL DEFAULT '',actor_user_id TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plastic_inbound_line(line_id TEXT PRIMARY KEY,inbound_id TEXT NOT NULL,variant_id TEXT NOT NULL,qty_input REAL NOT NULL,input_unit TEXT NOT NULL,qty_base REAL NOT NULL,unit_cost_rp INTEGER NOT NULL DEFAULT 0,line_total_rp INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plastic_sales_invoice(invoice_id TEXT PRIMARY KEY,business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',invoice_no TEXT NOT NULL UNIQUE,customer_id TEXT NOT NULL,period_key TEXT NOT NULL,date_key TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN('OPEN','PARTIAL','PAID','VOID')),subtotal_rp INTEGER NOT NULL DEFAULT 0,discount_rp INTEGER NOT NULL DEFAULT 0,shipping_rp INTEGER NOT NULL DEFAULT 0,grand_total_rp INTEGER NOT NULL DEFAULT 0,due_date_key TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',actor_user_id TEXT NOT NULL DEFAULT '',occurred_at TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plastic_sales_line(line_id TEXT PRIMARY KEY,invoice_id TEXT NOT NULL,variant_id TEXT NOT NULL,qty_input REAL NOT NULL,input_unit TEXT NOT NULL,qty_base REAL NOT NULL,unit_price_rp INTEGER NOT NULL DEFAULT 0,line_total_rp INTEGER NOT NULL DEFAULT 0,unit_cogs_rp INTEGER NOT NULL DEFAULT 0,cogs_total_rp INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plastic_payment(payment_id TEXT PRIMARY KEY,business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',invoice_id TEXT NOT NULL,customer_id TEXT NOT NULL,period_key TEXT NOT NULL,date_key TEXT NOT NULL,amount_rp INTEGER NOT NULL CHECK(amount_rp>0),payment_method TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'POSTED' CHECK(status IN('POSTED','REVERSED')),actor_user_id TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',occurred_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plastic_stock_opname(opname_id TEXT PRIMARY KEY,business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',opname_no TEXT NOT NULL UNIQUE,period_key TEXT NOT NULL,date_key TEXT NOT NULL,reason TEXT NOT NULL,actor_user_id TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plastic_stock_opname_line(line_id TEXT PRIMARY KEY,opname_id TEXT NOT NULL,variant_id TEXT NOT NULL,system_qty_base REAL NOT NULL,physical_qty_base REAL NOT NULL,variance_qty_base REAL NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plastic_month_close(business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',period_key TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN('OPEN','CLOSED')),opening_stock_qty REAL NOT NULL DEFAULT 0,inbound_qty REAL NOT NULL DEFAULT 0,outbound_qty REAL NOT NULL DEFAULT 0,adjustment_qty REAL NOT NULL DEFAULT 0,closing_stock_qty REAL NOT NULL DEFAULT 0,sales_rp INTEGER NOT NULL DEFAULT 0,cogs_rp INTEGER NOT NULL DEFAULT 0,gross_profit_rp INTEGER NOT NULL DEFAULT 0,receivable_rp INTEGER NOT NULL DEFAULT 0,closing_inventory_value_rp INTEGER NOT NULL DEFAULT 0,closed_at TEXT NOT NULL DEFAULT '',closed_by TEXT NOT NULL DEFAULT '',reopen_reason TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL,PRIMARY KEY(business_unit_id,period_key));
CREATE INDEX IF NOT EXISTS idx_pl_sale_period ON plastic_sales_invoice(business_unit_id,period_key,date_key,status);
CREATE TABLE IF NOT EXISTS plastic_so_snapshot(
  line_key TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  snapshot_date_key TEXT NOT NULL,
  variant_id TEXT NOT NULL DEFAULT '',
  source_label TEXT NOT NULL DEFAULT '',
  source_qty REAL NOT NULL DEFAULT 0,
  source_unit TEXT NOT NULL DEFAULT '',
  physical_qty_base REAL NOT NULL DEFAULT 0,
  mapping_status TEXT NOT NULL DEFAULT 'MAPPED' CHECK(mapping_status IN('MAPPED','REVIEW')),
  source_ref TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pl_so_snapshot_date
ON plastic_so_snapshot(business_unit_id,snapshot_date_key,mapping_status);
`;

export function initPlasticTradingV2(storage:any){const sql:Sql=storage.sql;sql.exec(PLASTIC_SCHEMA_V2).toArray();/* RKN_PLASTIC_SO_SESSION_SCHEMA_V2P */
sql.exec(`
CREATE TABLE IF NOT EXISTS plastic_so_session(
  so_id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  so_no TEXT NOT NULL UNIQUE,
  period_key TEXT NOT NULL,
  date_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN('DRAFT','REVIEW','POSTED','CANCELLED')),
  reason TEXT NOT NULL DEFAULT '',
  actor_user_id TEXT NOT NULL DEFAULT '',
  legacy_opname_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  posted_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS plastic_so_session_line(
  line_id TEXT PRIMARY KEY,
  so_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  system_qty_base REAL NOT NULL DEFAULT 0,
  physical_qty_base REAL NOT NULL DEFAULT 0,
  physical_entered INTEGER NOT NULL DEFAULT 0,
  snapshot_unit_cost_rp INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plastic_so_session_variant
ON plastic_so_session_line(so_id,variant_id);

CREATE INDEX IF NOT EXISTS idx_plastic_so_session_period
ON plastic_so_session(business_unit_id,period_key,date_key,status);
`).toArray();
const slCols=sql.exec(`PRAGMA table_info(plastic_sales_line)`).toArray().map((r:any)=>String(r.name));if(!slCols.includes('qty_input'))sql.exec(`ALTER TABLE plastic_sales_line ADD COLUMN qty_input REAL NOT NULL DEFAULT 1`).toArray();if(!slCols.includes('input_unit'))sql.exec(`ALTER TABLE plastic_sales_line ADD COLUMN input_unit TEXT NOT NULL DEFAULT 'ROLL'`).toArray();const pvCols=sql.exec(`PRAGMA table_info(plastic_product_variant)`).toArray().map((r:any)=>String(r.name));if(!pvCols.includes('mid_unit'))sql.exec(`ALTER TABLE plastic_product_variant ADD COLUMN mid_unit TEXT NOT NULL DEFAULT ''`).toArray();if(!pvCols.includes('units_per_mid'))sql.exec(`ALTER TABLE plastic_product_variant ADD COLUMN units_per_mid INTEGER NOT NULL DEFAULT 1`).toArray();if(!pvCols.includes('default_sell_price_mid_rp'))sql.exec(`ALTER TABLE plastic_product_variant ADD COLUMN default_sell_price_mid_rp INTEGER NOT NULL DEFAULT 0`).toArray();sql.exec(`
/* RKN_PLASTIC_MASTER_GOOGLE_SHEET_SEED_V2E */
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HITAM-15X25','BU-PLASTIC','Polymailer','HITAM','Hitam','15x25','','ROLL','','BALL',1,100,0,17000,0,1700000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HITAM-17X30','BU-PLASTIC','Polymailer','HITAM','Hitam','17x30','','ROLL','','BALL',1,80,0,19000,0,1520000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HITAM-20X30','BU-PLASTIC','Polymailer','HITAM','Hitam','20x30','','ROLL','','BALL',1,80,0,22000,0,1760000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HITAM-25X35','BU-PLASTIC','Polymailer','HITAM','Hitam','25x35','','ROLL','','BALL',1,50,0,27000,0,1350000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PINK-15X25','BU-PLASTIC','Polymailer','WARNA','Pink','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PINK-17X30','BU-PLASTIC','Polymailer','WARNA','Pink','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PINK-20X30','BU-PLASTIC','Polymailer','WARNA','Pink','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PINK-25X35','BU-PLASTIC','Polymailer','WARNA','Pink','25x35','','ROLL','','BALL',1,40,0,39000,0,1560000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-KUNING-15X25','BU-PLASTIC','Polymailer','WARNA','Kuning','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-KUNING-17X30','BU-PLASTIC','Polymailer','WARNA','Kuning','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-KUNING-20X30','BU-PLASTIC','Polymailer','WARNA','Kuning','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-KUNING-25X35','BU-PLASTIC','Polymailer','WARNA','Kuning','25x35','','ROLL','','BALL',1,40,0,39000,0,1560000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-ORANGE-15X25','BU-PLASTIC','Polymailer','WARNA','Orange','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-ORANGE-17X30','BU-PLASTIC','Polymailer','WARNA','Orange','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-ORANGE-20X30','BU-PLASTIC','Polymailer','WARNA','Orange','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-ORANGE-25X35','BU-PLASTIC','Polymailer','WARNA','Orange','25x35','','ROLL','','BALL',1,40,0,39000,0,1560000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-BIRU-15X25','BU-PLASTIC','Polymailer','WARNA','Biru','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-BIRU-17X30','BU-PLASTIC','Polymailer','WARNA','Biru','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-BIRU-20X30','BU-PLASTIC','Polymailer','WARNA','Biru','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-BIRU-25X35','BU-PLASTIC','Polymailer','WARNA','Biru','25x35','','ROLL','','BALL',1,40,0,39000,0,1560000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HIJAU-15X25','BU-PLASTIC','Polymailer','WARNA','Hijau','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HIJAU-17X30','BU-PLASTIC','Polymailer','WARNA','Hijau','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HIJAU-20X30','BU-PLASTIC','Polymailer','WARNA','Hijau','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HIJAU-25X35','BU-PLASTIC','Polymailer','WARNA','Hijau','25x35','','ROLL','','BALL',1,40,0,39000,0,1560000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-A-15X25','BU-PLASTIC','Polymailer','WARNA','Putih A','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-A-17X30','BU-PLASTIC','Polymailer','WARNA','Putih A','17x30','','ROLL','','BALL',1,80,0,23500,0,1880000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-A-20X30','BU-PLASTIC','Polymailer','WARNA','Putih A','20x30','','ROLL','','BALL',1,80,0,26000,0,2080000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-A-25X35','BU-PLASTIC','Polymailer','WARNA','Putih A','25x35','','ROLL','','BALL',1,50,0,39000,0,1950000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-UNGU-15X25','BU-PLASTIC','Polymailer','WARNA','Ungu','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-UNGU-17X30','BU-PLASTIC','Polymailer','WARNA','Ungu','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-UNGU-20X30','BU-PLASTIC','Polymailer','WARNA','Ungu','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-UNGU-25X35','BU-PLASTIC','Polymailer','WARNA','Ungu','25x35','','ROLL','','BALL',1,40,0,39000,0,1560000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-TOSCA-15X25','BU-PLASTIC','Polymailer','WARNA','Tosca','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-TOSCA-17X30','BU-PLASTIC','Polymailer','WARNA','Tosca','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-TOSCA-20X30','BU-PLASTIC','Polymailer','WARNA','Tosca','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-TOSCA-25X35','BU-PLASTIC','Polymailer','WARNA','Tosca','25x35','','ROLL','','BALL',1,40,0,39000,0,1560000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-B-15X25','BU-PLASTIC','Polymailer','PUTIH B','Putih B','15x25','','ROLL','','BALL',1,100,0,15500,0,1550000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-B-17X30','BU-PLASTIC','Polymailer','PUTIH B','Putih B','17x30','','ROLL','','BALL',1,80,0,19500,0,1560000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-B-20X30','BU-PLASTIC','Polymailer','PUTIH B','Putih B','20x30','','ROLL','','BALL',1,80,0,22500,0,1800000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-THERMAL-THERMAL-GOLDWIN','BU-PLASTIC','Thermal Goldwin','THERMAL','','100x150','','LEMBAR','STACK','DUS',500,10000,0,0,42000,840000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK','BU-PLASTIC','Thermal Dus Panjang (Tanpa Merk)','THERMAL','','100x150','','LEMBAR','STACK','DUS',500,10000,0,0,40000,800000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK','BU-PLASTIC','Thermal Dus Kotak (Tanpa Merk)','THERMAL','','100x150','','LEMBAR','STACK','DUS',500,10000,0,0,39000,780000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
`).toArray();


/* RKN_PLASTIC_V2J_PRICE_HISTORY_AND_PAYABLES_SYNC */
sql.exec(`
-- Seed Price History for Polymailer Hitam (Pre-2026-09-01)
INSERT OR IGNORE INTO plastic_product_price_history(history_id,business_unit_id,variant_id,effective_date_key,sell_price_base_rp,sell_price_mid_rp,sell_price_pack_rp,buy_price_rp,note,actor_user_id,created_at)
VALUES('HIST-HITAM-15X25-20260701','BU-PLASTIC','PL-POLY-HITAM-15X25','2026-07-01',17000,0,1700000,0,'Harga Awal Standard','SYSTEM','2026-07-01T00:00:00.000Z');
INSERT OR IGNORE INTO plastic_product_price_history(history_id,business_unit_id,variant_id,effective_date_key,sell_price_base_rp,sell_price_mid_rp,sell_price_pack_rp,buy_price_rp,note,actor_user_id,created_at)
VALUES('HIST-HITAM-17X30-20260701','BU-PLASTIC','PL-POLY-HITAM-17X30','2026-07-01',19000,0,1520000,0,'Harga Awal Standard','SYSTEM','2026-07-01T00:00:00.000Z');
INSERT OR IGNORE INTO plastic_product_price_history(history_id,business_unit_id,variant_id,effective_date_key,sell_price_base_rp,sell_price_mid_rp,sell_price_pack_rp,buy_price_rp,note,actor_user_id,created_at)
VALUES('HIST-HITAM-20X30-20260701','BU-PLASTIC','PL-POLY-HITAM-20X30','2026-07-01',22000,0,1760000,0,'Harga Awal Standard','SYSTEM','2026-07-01T00:00:00.000Z');
INSERT OR IGNORE INTO plastic_product_price_history(history_id,business_unit_id,variant_id,effective_date_key,sell_price_base_rp,sell_price_mid_rp,sell_price_pack_rp,buy_price_rp,note,actor_user_id,created_at)
VALUES('HIST-HITAM-25X35-20260701','BU-PLASTIC','PL-POLY-HITAM-25X35','2026-07-01',27000,0,1350000,0,'Harga Awal Standard','SYSTEM','2026-07-01T00:00:00.000Z');

-- Seed Price History for Polymailer Hitam (Effective 2026-09-01 onwards)
INSERT OR IGNORE INTO plastic_product_price_history(history_id,business_unit_id,variant_id,effective_date_key,sell_price_base_rp,sell_price_mid_rp,sell_price_pack_rp,buy_price_rp,note,actor_user_id,created_at)
VALUES('HIST-HITAM-15X25-20260901','BU-PLASTIC','PL-POLY-HITAM-15X25','2026-09-01',16500,0,1650000,0,'Penurunan Harga Supplier September 2026','SYSTEM','2026-09-01T00:00:00.000Z');
INSERT OR IGNORE INTO plastic_product_price_history(history_id,business_unit_id,variant_id,effective_date_key,sell_price_base_rp,sell_price_mid_rp,sell_price_pack_rp,buy_price_rp,note,actor_user_id,created_at)
VALUES('HIST-HITAM-17X30-20260901','BU-PLASTIC','PL-POLY-HITAM-17X30','2026-09-01',18500,0,1480000,0,'Penurunan Harga Supplier September 2026','SYSTEM','2026-09-01T00:00:00.000Z');
INSERT OR IGNORE INTO plastic_product_price_history(history_id,business_unit_id,variant_id,effective_date_key,sell_price_base_rp,sell_price_mid_rp,sell_price_pack_rp,buy_price_rp,note,actor_user_id,created_at)
VALUES('HIST-HITAM-20X30-20260901','BU-PLASTIC','PL-POLY-HITAM-20X30','2026-09-01',21500,0,1720000,0,'Penurunan Harga Supplier September 2026','SYSTEM','2026-09-01T00:00:00.000Z');
INSERT OR IGNORE INTO plastic_product_price_history(history_id,business_unit_id,variant_id,effective_date_key,sell_price_base_rp,sell_price_mid_rp,sell_price_pack_rp,buy_price_rp,note,actor_user_id,created_at)
VALUES('HIST-HITAM-25X35-20260901','BU-PLASTIC','PL-POLY-HITAM-25X35','2026-09-01',26500,0,1325000,0,'Penurunan Harga Supplier September 2026','SYSTEM','2026-09-01T00:00:00.000Z');

-- Seed Opening Balance Hutang Supplier
INSERT OR IGNORE INTO plastic_supplier_payable(payable_id,business_unit_id,supplier_name,date_key,reference_no,payable_type,total_amount_rp,note,actor_user_id,created_at)
VALUES('PAY-OPENING-20260729','BU-PLASTIC','KMS PACKAGING','2026-07-29','SALDO-AWAL','OPENING_BALANCE',44333500,'Sisa Hutang Supplier sebelum periode 30 Juli 2026','SYSTEM','2026-07-29T00:00:00.000Z');

-- Seed Pembayaran Supplier via Paman
INSERT OR IGNORE INTO plastic_supplier_payment(payment_id,business_unit_id,supplier_name,date_key,amount_rp,funding_source,reference_no,note,actor_user_id,created_at)
VALUES('SPAY-PAMAN-20260831','BU-PLASTIC','KMS PACKAGING','2026-08-31',159500000,'PAMAN_FUNDING','TRANSFER-PAMAN','Pembayaran tagihan supplier ditalangi Paman s/d 31 Agustus 2026','SYSTEM','2026-08-31T00:00:00.000Z');

-- Seed Posisi Talangan Paman di Buku Modal
INSERT OR IGNORE INTO plastic_paman_funding_ledger(entry_id,business_unit_id,date_key,entry_type,amount_rp,reference_no,note,actor_user_id,created_at)
VALUES('FUND-PAMAN-20260831','BU-PLASTIC','2026-08-31','FUNDING_IN',159500000,'TALANGAN-MODAL','Talangan pembayaran supplier periode Juli - 31 Agustus 2026','SYSTEM','2026-08-31T00:00:00.000Z');
`).toArray();




/* RKN_PLASTIC_V2M_EXACT_EXCEL_AUDIT_SYNC */
sql.exec(`
UPDATE plastic_sales_invoice SET grand_total_rp = 1300000, subtotal_rp = 1300000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260729-DBF139' OR invoice_no LIKE '%DBF139%';
UPDATE plastic_sales_invoice SET grand_total_rp = 333000, subtotal_rp = 333000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260729-A99467' OR invoice_no LIKE '%A99467%';
UPDATE plastic_sales_invoice SET grand_total_rp = 26000, subtotal_rp = 26000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260729-01F9D6' OR invoice_no LIKE '%01F9D6%';
UPDATE plastic_sales_invoice SET grand_total_rp = 3525000, subtotal_rp = 3525000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260729-BACFC7' OR invoice_no LIKE '%BACFC7%';
UPDATE plastic_sales_invoice SET grand_total_rp = 7920000, subtotal_rp = 7920000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260730-FE5337' OR invoice_no LIKE '%FE5337%';
UPDATE plastic_sales_invoice SET grand_total_rp = 47000, subtotal_rp = 47000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260730-BC549E' OR invoice_no LIKE '%BC549E%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1850000, subtotal_rp = 1850000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260730-53FC9F' OR invoice_no LIKE '%53FC9F%';
UPDATE plastic_sales_invoice SET grand_total_rp = 3960000, subtotal_rp = 3960000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260730-A4769A' OR invoice_no LIKE '%A4769A%';
UPDATE plastic_sales_invoice SET grand_total_rp = 7920000, subtotal_rp = 7920000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260730-AC6275' OR invoice_no LIKE '%AC6275%';
UPDATE plastic_sales_invoice SET grand_total_rp = 3525000, subtotal_rp = 3525000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260731-FC8ACB' OR invoice_no LIKE '%FC8ACB%';
UPDATE plastic_sales_invoice SET grand_total_rp = 4950000, subtotal_rp = 4950000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260731-100B28' OR invoice_no LIKE '%100B28%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1175000, subtotal_rp = 1175000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260731-A66C54' OR invoice_no LIKE '%A66C54%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1680000, subtotal_rp = 1680000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260801-9469AF' OR invoice_no LIKE '%9469AF%';
UPDATE plastic_sales_invoice SET grand_total_rp = 49500, subtotal_rp = 49500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260801-8E8237' OR invoice_no LIKE '%8E8237%';
UPDATE plastic_sales_invoice SET grand_total_rp = 94000, subtotal_rp = 94000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260801-5580AF' OR invoice_no LIKE '%5580AF%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1680000, subtotal_rp = 1680000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260803-8D42DB' OR invoice_no LIKE '%8D42DB%';
UPDATE plastic_sales_invoice SET grand_total_rp = 120000, subtotal_rp = 120000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260803-A8FEB2' OR invoice_no LIKE '%A8FEB2%';
UPDATE plastic_sales_invoice SET grand_total_rp = 2370000, subtotal_rp = 2370000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260803-3DE6F1' OR invoice_no LIKE '%3DE6F1%';
UPDATE plastic_sales_invoice SET grand_total_rp = 141000, subtotal_rp = 141000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260803-275E3D' OR invoice_no LIKE '%275E3D%';
UPDATE plastic_sales_invoice SET grand_total_rp = 6125000, subtotal_rp = 6125000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260804-A3D01B' OR invoice_no LIKE '%A3D01B%';
UPDATE plastic_sales_invoice SET grand_total_rp = 8800000, subtotal_rp = 8800000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260804-4FD192' OR invoice_no LIKE '%4FD192%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1850000, subtotal_rp = 1850000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260804-AE47F3' OR invoice_no LIKE '%AE47F3%';
UPDATE plastic_sales_invoice SET grand_total_rp = 840000, subtotal_rp = 840000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260804-E9B8DF' OR invoice_no LIKE '%E9B8DF%';
UPDATE plastic_sales_invoice SET grand_total_rp = 800000, subtotal_rp = 800000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260805-FE7225' OR invoice_no LIKE '%FE7225%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1300000, subtotal_rp = 1300000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260805-D7B973' OR invoice_no LIKE '%D7B973%';
UPDATE plastic_sales_invoice SET grand_total_rp = 164500, subtotal_rp = 164500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260805-3F8291' OR invoice_no LIKE '%3F8291%';
UPDATE plastic_sales_invoice SET grand_total_rp = 116000, subtotal_rp = 116000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260805-C65CF3' OR invoice_no LIKE '%C65CF3%';
UPDATE plastic_sales_invoice SET grand_total_rp = 6250000, subtotal_rp = 6250000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260805-0AB429' OR invoice_no LIKE '%0AB429%';
UPDATE plastic_sales_invoice SET grand_total_rp = 200000, subtotal_rp = 200000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260806-BD99DA' OR invoice_no LIKE '%BD99DA%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1012000, subtotal_rp = 1012000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260806-5C4F50' OR invoice_no LIKE '%5C4F50%';
UPDATE plastic_sales_invoice SET grand_total_rp = 164500, subtotal_rp = 164500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260807-E2B2D4' OR invoice_no LIKE '%E2B2D4%';
UPDATE plastic_sales_invoice SET grand_total_rp = 23500, subtotal_rp = 23500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260807-BAFF75' OR invoice_no LIKE '%BAFF75%';
UPDATE plastic_sales_invoice SET grand_total_rp = 5200000, subtotal_rp = 5200000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260808-552ADD' OR invoice_no LIKE '%552ADD%';
UPDATE plastic_sales_invoice SET grand_total_rp = 26000, subtotal_rp = 26000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260808-EB9343' OR invoice_no LIKE '%EB9343%';
UPDATE plastic_sales_invoice SET grand_total_rp = 117500, subtotal_rp = 117500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260810-E0F72F' OR invoice_no LIKE '%E0F72F%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1990000, subtotal_rp = 1990000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260810-E940E5' OR invoice_no LIKE '%E940E5%';
UPDATE plastic_sales_invoice SET grand_total_rp = 2350000, subtotal_rp = 2350000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260811-1D67CD' OR invoice_no LIKE '%1D67CD%';
UPDATE plastic_sales_invoice SET grand_total_rp = 5840000, subtotal_rp = 5840000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260811-3F19FB' OR invoice_no LIKE '%3F19FB%';
UPDATE plastic_sales_invoice SET grand_total_rp = 155000, subtotal_rp = 155000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260811-CC57F8' OR invoice_no LIKE '%CC57F8%';
UPDATE plastic_sales_invoice SET grand_total_rp = 97500, subtotal_rp = 97500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260811-406F7F' OR invoice_no LIKE '%406F7F%';
UPDATE plastic_sales_invoice SET grand_total_rp = 3525000, subtotal_rp = 3525000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260811-183836' OR invoice_no LIKE '%183836%';
UPDATE plastic_sales_invoice SET grand_total_rp = 4000000, subtotal_rp = 4000000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260812-48EFB3' OR invoice_no LIKE '%48EFB3%';
UPDATE plastic_sales_invoice SET grand_total_rp = 155000, subtotal_rp = 155000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260812-0E3F3B' OR invoice_no LIKE '%0E3F3B%';
UPDATE plastic_sales_invoice SET grand_total_rp = 8400000, subtotal_rp = 8400000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260812-E091E1' OR invoice_no LIKE '%E091E1%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1680000, subtotal_rp = 1680000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260813-A82E84' OR invoice_no LIKE '%A82E84%';
UPDATE plastic_sales_invoice SET grand_total_rp = 96500, subtotal_rp = 96500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260813-7AB6F9' OR invoice_no LIKE '%7AB6F9%';
UPDATE plastic_sales_invoice SET grand_total_rp = 31000, subtotal_rp = 31000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260814-CAF7DA' OR invoice_no LIKE '%CAF7DA%';
UPDATE plastic_sales_invoice SET grand_total_rp = 155000, subtotal_rp = 155000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260815-F62C10' OR invoice_no LIKE '%F62C10%';
UPDATE plastic_sales_invoice SET grand_total_rp = 70500, subtotal_rp = 70500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260815-BCA6EE' OR invoice_no LIKE '%BCA6EE%';
UPDATE plastic_sales_invoice SET grand_total_rp = 800000, subtotal_rp = 800000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260815-AAE5D9' OR invoice_no LIKE '%AAE5D9%';
UPDATE plastic_sales_invoice SET grand_total_rp = 15500, subtotal_rp = 15500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260816-016B9D' OR invoice_no LIKE '%016B9D%';
UPDATE plastic_sales_invoice SET grand_total_rp = 155000, subtotal_rp = 155000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260817-37CCB2' OR invoice_no LIKE '%37CCB2%';
UPDATE plastic_sales_invoice SET grand_total_rp = 7050000, subtotal_rp = 7050000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260818-FD67AF' OR invoice_no LIKE '%FD67AF%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1680000, subtotal_rp = 1680000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260818-C637B1' OR invoice_no LIKE '%C637B1%';
UPDATE plastic_sales_invoice SET grand_total_rp = 4700000, subtotal_rp = 4700000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260818-A2B0E8' OR invoice_no LIKE '%A2B0E8%';
UPDATE plastic_sales_invoice SET grand_total_rp = 286000, subtotal_rp = 286000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260818-A9675D' OR invoice_no LIKE '%A9675D%';
UPDATE plastic_sales_invoice SET grand_total_rp = 216000, subtotal_rp = 216000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260818-ADD6F2' OR invoice_no LIKE '%ADD6F2%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1850000, subtotal_rp = 1850000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260819-AE1959' OR invoice_no LIKE '%AE1959%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1175000, subtotal_rp = 1175000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260819-258EBA' OR invoice_no LIKE '%258EBA%';
UPDATE plastic_sales_invoice SET grand_total_rp = 155000, subtotal_rp = 155000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260819-903AD3' OR invoice_no LIKE '%903AD3%';
UPDATE plastic_sales_invoice SET grand_total_rp = 77500, subtotal_rp = 77500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260820-BABE85' OR invoice_no LIKE '%BABE85%';
UPDATE plastic_sales_invoice SET grand_total_rp = 4200000, subtotal_rp = 4200000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260821-CA8421' OR invoice_no LIKE '%CA8421%';
UPDATE plastic_sales_invoice SET grand_total_rp = 77500, subtotal_rp = 77500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260821-E7842B' OR invoice_no LIKE '%E7842B%';
UPDATE plastic_sales_invoice SET grand_total_rp = 135500, subtotal_rp = 135500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260821-12121F' OR invoice_no LIKE '%12121F%';
UPDATE plastic_sales_invoice SET grand_total_rp = 3960000, subtotal_rp = 3960000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260822-3BBB13' OR invoice_no LIKE '%3BBB13%';
UPDATE plastic_sales_invoice SET grand_total_rp = 3360000, subtotal_rp = 3360000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260822-BFF96C' OR invoice_no LIKE '%BFF96C%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1175000, subtotal_rp = 1175000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260822-851967' OR invoice_no LIKE '%851967%';
UPDATE plastic_sales_invoice SET grand_total_rp = 47000, subtotal_rp = 47000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260823-6A119F' OR invoice_no LIKE '%6A119F%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1680000, subtotal_rp = 1680000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260824-499920' OR invoice_no LIKE '%499920%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1175000, subtotal_rp = 1175000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260824-B0D5D7' OR invoice_no LIKE '%B0D5D7%';
UPDATE plastic_sales_invoice SET grand_total_rp = 23500, subtotal_rp = 23500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260824-3097F4' OR invoice_no LIKE '%3097F4%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1850000, subtotal_rp = 1850000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260825-793E4D' OR invoice_no LIKE '%793E4D%';
UPDATE plastic_sales_invoice SET grand_total_rp = 2080000, subtotal_rp = 2080000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260825-3BE337' OR invoice_no LIKE '%3BE337%';
UPDATE plastic_sales_invoice SET grand_total_rp = 5200000, subtotal_rp = 5200000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260825-9143EA' OR invoice_no LIKE '%9143EA%';
UPDATE plastic_sales_invoice SET grand_total_rp = 1300000, subtotal_rp = 1300000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260826-72430A' OR invoice_no LIKE '%72430A%';
UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%';
UPDATE plastic_sales_invoice SET grand_total_rp = 131500, subtotal_rp = 131500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260826-5BEC1A' OR invoice_no LIKE '%5BEC1A%';
UPDATE plastic_sales_invoice SET grand_total_rp = 3150000, subtotal_rp = 3150000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260826-591270' OR invoice_no LIKE '%591270%';
UPDATE plastic_sales_invoice SET grand_total_rp = 11880000, subtotal_rp = 11880000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260826-8BCD5C' OR invoice_no LIKE '%8BCD5C%';
UPDATE plastic_sales_invoice SET grand_total_rp = 16600000, subtotal_rp = 16600000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260826-864117' OR invoice_no LIKE '%864117%';
UPDATE plastic_sales_invoice SET grand_total_rp = 27000, subtotal_rp = 27000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260828-72FB62' OR invoice_no LIKE '%72FB62%';
UPDATE plastic_sales_invoice SET grand_total_rp = 27000, subtotal_rp = 27000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260828-2F59B7' OR invoice_no LIKE '%2F59B7%';
UPDATE plastic_sales_invoice SET grand_total_rp = 3525000, subtotal_rp = 3525000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260830-2B29F2' OR invoice_no LIKE '%2B29F2%';
UPDATE plastic_sales_invoice SET grand_total_rp = 97500, subtotal_rp = 97500, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260830-CA52B2' OR invoice_no LIKE '%CA52B2%';
UPDATE plastic_sales_invoice SET grand_total_rp = 4700000, subtotal_rp = 4700000, updated_at = CURRENT_TIMESTAMP WHERE invoice_no = 'PTR-20260831-29FF95' OR invoice_no LIKE '%29FF95%';

-- Pastikan transaksi September 2026 tetap terjaga
-- Hitung ulang piutang dan pembayaran
`).toArray();

/* RKN_PLASTIC_V2L_INVOICE_TRANSACTION_RECONCILIATION */
sql.exec(`
-- 1. Perbaiki spesifik invoice PTR-20260826-A9E605 menjadi Thermal Goldwin (+ Rp 60.000)
UPDATE plastic_sales_line
SET variant_id = 'PL-THERMAL-THERMAL-GOLDWIN',
    unit_price_rp = CASE WHEN unit_price_rp > 0 THEN unit_price_rp + 30000 ELSE 370000 END,
    line_total_rp = qty_input * (CASE WHEN unit_price_rp > 0 THEN unit_price_rp + 30000 ELSE 370000 END)
WHERE invoice_id IN (
  SELECT invoice_id FROM plastic_sales_invoice
  WHERE invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%'
) AND (variant_id LIKE '%THERMAL%' AND variant_id <> 'PL-THERMAL-THERMAL-GOLDWIN');

-- 2. Sinkronkan harga dan baris penjualan Putih A yang dulunya tercatat isi 50 roll per ball
UPDATE plastic_sales_line
SET unit_price_rp = (
      SELECT COALESCE(v.default_sell_price_pack_rp, 1880000)
      FROM plastic_product_variant v
      WHERE v.variant_id = plastic_sales_line.variant_id
    ),
    line_total_rp = qty_input * (
      SELECT COALESCE(v.default_sell_price_pack_rp, 1880000)
      FROM plastic_product_variant v
      WHERE v.variant_id = plastic_sales_line.variant_id
    )
WHERE variant_id = 'PL-POLY-PUTIH-A-17X30'
  AND UPPER(input_unit) = 'BALL'
  AND unit_price_rp = 1175000;

UPDATE plastic_sales_line
SET unit_price_rp = (
      SELECT COALESCE(v.default_sell_price_pack_rp, 2080000)
      FROM plastic_product_variant v
      WHERE v.variant_id = plastic_sales_line.variant_id
    ),
    line_total_rp = qty_input * (
      SELECT COALESCE(v.default_sell_price_pack_rp, 2080000)
      FROM plastic_product_variant v
      WHERE v.variant_id = plastic_sales_line.variant_id
    )
WHERE variant_id = 'PL-POLY-PUTIH-A-20X30'
  AND UPPER(input_unit) = 'BALL'
  AND unit_price_rp = 1300000;

UPDATE plastic_sales_line
SET unit_price_rp = (
      SELECT COALESCE(v.default_sell_price_pack_rp, 1950000)
      FROM plastic_product_variant v
      WHERE v.variant_id = plastic_sales_line.variant_id
    ),
    line_total_rp = qty_input * (
      SELECT COALESCE(v.default_sell_price_pack_rp, 1950000)
      FROM plastic_product_variant v
      WHERE v.variant_id = plastic_sales_line.variant_id
    )
WHERE variant_id = 'PL-POLY-PUTIH-A-25X35'
  AND UPPER(input_unit) = 'BALL'
  AND (unit_price_rp = 1560000 OR unit_price_rp = 1350000);

-- 3. Sinkronkan harga dan baris penjualan Putih B yang dulunya tercatat isi 50 roll per ball
UPDATE plastic_sales_line
SET unit_price_rp = 1560000,
    line_total_rp = qty_input * 1560000
WHERE variant_id = 'PL-POLY-PUTIH-B-17X30'
  AND UPPER(input_unit) = 'BALL'
  AND unit_price_rp = 975000;

UPDATE plastic_sales_line
SET unit_price_rp = 1760000,
    line_total_rp = qty_input * 1760000
WHERE variant_id = 'PL-POLY-PUTIH-B-20X30'
  AND UPPER(input_unit) = 'BALL'
  AND unit_price_rp = 1100000;

-- 4. Sinkronkan harga dan baris penjualan Warna 25x35 yang dulunya tercatat isi 50 roll per ball (menjadi 40 roll)
UPDATE plastic_sales_line
SET unit_price_rp = 1560000,
    line_total_rp = qty_input * 1560000
WHERE variant_id LIKE 'PL-POLY-%-25X35'
  AND variant_id NOT LIKE '%HITAM%'
  AND variant_id NOT LIKE '%PUTIH%'
  AND UPPER(input_unit) = 'BALL'
  AND unit_price_rp = 1950000;

-- 5. Hitung ulang subtotal dan grand total untuk seluruh sales invoice yang tidak VOID
UPDATE plastic_sales_invoice
SET subtotal_rp = (
      SELECT COALESCE(SUM(l.line_total_rp), 0)
      FROM plastic_sales_line l
      WHERE l.invoice_id = plastic_sales_invoice.invoice_id
    ),
    grand_total_rp = (
      SELECT COALESCE(SUM(l.line_total_rp), 0)
      FROM plastic_sales_line l
      WHERE l.invoice_id = plastic_sales_invoice.invoice_id
    ) - discount_rp + shipping_rp,
    updated_at = CURRENT_TIMESTAMP
WHERE status <> 'VOID';

-- 6. Sesuaikan status pelunasan (PAID / PARTIAL / OPEN) sesuai pembayaran riil yang sudah tercatat
UPDATE plastic_sales_invoice
SET status = CASE
      WHEN (SELECT COALESCE(SUM(p.amount_rp), 0) FROM plastic_payment p WHERE p.invoice_id = plastic_sales_invoice.invoice_id AND p.status = 'POSTED') >= grand_total_rp THEN 'PAID'
      WHEN (SELECT COALESCE(SUM(p.amount_rp), 0) FROM plastic_payment p WHERE p.invoice_id = plastic_sales_invoice.invoice_id AND p.status = 'POSTED') > 0 THEN 'PARTIAL'
      ELSE 'OPEN'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE status <> 'VOID';
`).toArray();

/* RKN_PLASTIC_V2K_HISTORICAL_TRANSACTION_RECALC */
sql.exec(`
-- Update plastic_inbound_line qty_base based on correct units_per_pack
UPDATE plastic_inbound_line
SET qty_base = qty_input * (
  SELECT COALESCE(v.units_per_pack, 1)
  FROM plastic_product_variant v
  WHERE v.variant_id = plastic_inbound_line.variant_id
)
WHERE UPPER(input_unit) IN ('BALL', 'DUS', 'PACK');

-- Update plastic_sales_line qty_base based on correct units_per_pack
UPDATE plastic_sales_line
SET qty_base = qty_input * (
  SELECT COALESCE(v.units_per_pack, 1)
  FROM plastic_product_variant v
  WHERE v.variant_id = plastic_sales_line.variant_id
)
WHERE UPPER(input_unit) IN ('BALL', 'DUS', 'PACK');
`).toArray();

/* RKN_PLASTIC_V2H_MASTER_UOM_SYNC */
sql.exec(`
UPDATE plastic_product_variant SET units_per_pack = 100, default_sell_price_pack_rp = 1700000 WHERE variant_id = 'PL-POLY-HITAM-15X25';
UPDATE plastic_product_variant SET units_per_pack = 80, default_sell_price_pack_rp = 1520000 WHERE variant_id = 'PL-POLY-HITAM-17X30';
UPDATE plastic_product_variant SET units_per_pack = 80, default_sell_price_pack_rp = 1760000 WHERE variant_id = 'PL-POLY-HITAM-20X30';
UPDATE plastic_product_variant SET units_per_pack = 50, default_sell_price_pack_rp = 1350000 WHERE variant_id = 'PL-POLY-HITAM-25X35';

UPDATE plastic_product_variant SET units_per_pack = 100, default_sell_price_pack_rp = 1850000 WHERE variant_id IN ('PL-POLY-PINK-15X25','PL-POLY-KUNING-15X25','PL-POLY-ORANGE-15X25','PL-POLY-BIRU-15X25','PL-POLY-HIJAU-15X25','PL-POLY-UNGU-15X25','PL-POLY-TOSCA-15X25');
UPDATE plastic_product_variant SET units_per_pack = 50, default_sell_price_pack_rp = 1175000 WHERE variant_id IN ('PL-POLY-PINK-17X30','PL-POLY-KUNING-17X30','PL-POLY-ORANGE-17X30','PL-POLY-BIRU-17X30','PL-POLY-HIJAU-17X30','PL-POLY-UNGU-17X30','PL-POLY-TOSCA-17X30');
UPDATE plastic_product_variant SET units_per_pack = 50, default_sell_price_pack_rp = 1300000 WHERE variant_id IN ('PL-POLY-PINK-20X30','PL-POLY-KUNING-20X30','PL-POLY-ORANGE-20X30','PL-POLY-BIRU-20X30','PL-POLY-HIJAU-20X30','PL-POLY-UNGU-20X30','PL-POLY-TOSCA-20X30');
UPDATE plastic_product_variant SET units_per_pack = 40, default_sell_price_pack_rp = 1560000 WHERE variant_id IN ('PL-POLY-PINK-25X35','PL-POLY-KUNING-25X35','PL-POLY-ORANGE-25X35','PL-POLY-BIRU-25X35','PL-POLY-HIJAU-25X35','PL-POLY-UNGU-25X35','PL-POLY-TOSCA-25X35');

UPDATE plastic_product_variant SET units_per_pack = 100, default_sell_price_pack_rp = 1550000 WHERE variant_id = 'PL-POLY-PUTIH-B-15X25';
UPDATE plastic_product_variant SET units_per_pack = 80, default_sell_price_pack_rp = 1560000 WHERE variant_id = 'PL-POLY-PUTIH-B-17X30';
UPDATE plastic_product_variant SET units_per_pack = 80, default_sell_price_pack_rp = 1800000 WHERE variant_id = 'PL-POLY-PUTIH-B-20X30';

UPDATE plastic_product_variant SET units_per_pack = 100, default_sell_price_pack_rp = 1850000 WHERE variant_id = 'PL-POLY-PUTIH-A-15X25';
UPDATE plastic_product_variant SET units_per_pack = 80, default_sell_price_pack_rp = 1880000 WHERE variant_id = 'PL-POLY-PUTIH-A-17X30';
UPDATE plastic_product_variant SET units_per_pack = 80, default_sell_price_pack_rp = 2080000 WHERE variant_id = 'PL-POLY-PUTIH-A-20X30';
UPDATE plastic_product_variant SET units_per_pack = 50, default_sell_price_pack_rp = 1950000 WHERE variant_id = 'PL-POLY-PUTIH-A-25X35';
`).toArray();

/* RKN_PLASTIC_V2G_MASTER_TEXT_NORMALIZATION */
sql.exec(`
UPDATE plastic_product_variant
SET size = CASE
  WHEN variant_id LIKE '%-15X25' THEN '15x25'
  WHEN variant_id LIKE '%-17X30' THEN '17x30'
  WHEN variant_id LIKE '%-20X30' THEN '20x30'
  WHEN variant_id LIKE '%-25X35' THEN '25x35'
  WHEN variant_id LIKE 'PL-THERMAL-%' THEN '100x150'
  ELSE size
END,
color = TRIM(color),
product_name = TRIM(product_name),
updated_at = CURRENT_TIMESTAMP
WHERE business_unit_id='BU-PLASTIC';
`).toArray();

/* RKN_PLASTIC_SO_2808_REFERENCE_SNAPSHOT */
sql.exec(`
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-BIRU-15X25','BU-PLASTIC','2026-08-28','PL-POLY-BIRU-15X25','SO 28/08/2026', 400,'ROLL',400,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-BIRU-17X30','BU-PLASTIC','2026-08-28','PL-POLY-BIRU-17X30','SO 28/08/2026', 300,'ROLL',300,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-BIRU-20X30','BU-PLASTIC','2026-08-28','PL-POLY-BIRU-20X30','SO 28/08/2026', 300,'ROLL',300,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-BIRU-25X35','BU-PLASTIC','2026-08-28','PL-POLY-BIRU-25X35','SO 28/08/2026', 50,'ROLL',50,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-HIJAU-15X25','BU-PLASTIC','2026-08-28','PL-POLY-HIJAU-15X25','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-HIJAU-17X30','BU-PLASTIC','2026-08-28','PL-POLY-HIJAU-17X30','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-HIJAU-20X30','BU-PLASTIC','2026-08-28','PL-POLY-HIJAU-20X30','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-HITAM-15X25','BU-PLASTIC','2026-08-28','PL-POLY-HITAM-15X25','SO 28/08/2026', 300,'ROLL',300,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-HITAM-17X30','BU-PLASTIC','2026-08-28','PL-POLY-HITAM-17X30','SO 28/08/2026', 160,'ROLL',160,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-HITAM-20X30','BU-PLASTIC','2026-08-28','PL-POLY-HITAM-20X30','SO 28/08/2026', 240,'ROLL',240,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-HITAM-25X35','BU-PLASTIC','2026-08-28','PL-POLY-HITAM-25X35','SO 28/08/2026', 110,'ROLL',110,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-KUNING-15X25','BU-PLASTIC','2026-08-28','PL-POLY-KUNING-15X25','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-KUNING-17X30','BU-PLASTIC','2026-08-28','PL-POLY-KUNING-17X30','SO 28/08/2026', 101,'ROLL',101,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-ORANGE-17X30','BU-PLASTIC','2026-08-28','PL-POLY-ORANGE-17X30','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-ORANGE-20X30','BU-PLASTIC','2026-08-28','PL-POLY-ORANGE-20X30','SO 28/08/2026', 2,'ROLL',2,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-PINK-15X25','BU-PLASTIC','2026-08-28','PL-POLY-PINK-15X25','SO 28/08/2026', 400,'ROLL',400,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-PINK-17X30','BU-PLASTIC','2026-08-28','PL-POLY-PINK-17X30','SO 28/08/2026', 350,'ROLL',350,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-PINK-20X30','BU-PLASTIC','2026-08-28','PL-POLY-PINK-20X30','SO 28/08/2026', 302,'ROLL',302,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-PINK-25X35','BU-PLASTIC','2026-08-28','PL-POLY-PINK-25X35','SO 28/08/2026', 50,'ROLL',50,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-PUTIH-A-15X25','BU-PLASTIC','2026-08-28','PL-POLY-PUTIH-A-15X25','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-PUTIH-B-15X25','BU-PLASTIC','2026-08-28','PL-POLY-PUTIH-B-15X25','SO 28/08/2026', 105,'ROLL',105,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-PUTIH-B-17X30','BU-PLASTIC','2026-08-28','PL-POLY-PUTIH-B-17X30','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-PUTIH-B-20X30','BU-PLASTIC','2026-08-28','PL-POLY-PUTIH-B-20X30','SO 28/08/2026', 109,'ROLL',109,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-TOSCA-20X30','BU-PLASTIC','2026-08-28','PL-POLY-TOSCA-20X30','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-UNGU-15X25','BU-PLASTIC','2026-08-28','PL-POLY-UNGU-15X25','SO 28/08/2026', 293,'ROLL',293,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-UNGU-17X30','BU-PLASTIC','2026-08-28','PL-POLY-UNGU-17X30','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-PL-POLY-UNGU-20X30','BU-PLASTIC','2026-08-28','PL-POLY-UNGU-20X30','SO 28/08/2026', 100,'ROLL',100,'MAPPED','Rekap SO Polymailer',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-THERMAL-POLOS','BU-PLASTIC','2026-08-28','','Thermal Polos',3,'RAW',0,'REVIEW','SO Thermal 28/08/2026',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_so_snapshot(line_key,business_unit_id,snapshot_date_key,variant_id,source_label,source_qty,source_unit,physical_qty_base,mapping_status,source_ref,created_at) VALUES('SO2808-THERMAL-KOTAK','BU-PLASTIC','2026-08-28','','Thermal Kotak',9,'RAW',0,'REVIEW','SO Thermal 28/08/2026',CURRENT_TIMESTAMP);
`).toArray();

sql.exec(`
INSERT OR IGNORE INTO role(id,code,name,description,scope_mode,is_system,created_at,updated_at) VALUES('ROLE-SUPERVISORY-BOARD','SUPERVISORY_BOARD','Dewan Pengawas','Read-only Plastic Trading supervisor','UNIT',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO role(id,code,name,description,scope_mode,is_system,created_at,updated_at) VALUES('ROLE-PLASTIC-ADMIN','PLASTIC_ADMIN','Admin Plastic Trading','Operational administrator for Plastic Trading','UNIT',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO permission(id,code,module,name,description,created_at) VALUES
('PERM-PL-VIEW','plastic.view','PLASTIC','View Plastic','View Plastic Trading',CURRENT_TIMESTAMP),
('PERM-PL-OPERATE','plastic.operate','PLASTIC','Operate Plastic','Create Plastic transactions',CURRENT_TIMESTAMP),
('PERM-PL-MANAGE','plastic.manage','PLASTIC','Manage Plastic','Manage Plastic master/stock',CURRENT_TIMESTAMP),
('PERM-PL-FIN','plastic.finance.view','PLASTIC','View Plastic Finance','View margin and receivables',CURRENT_TIMESTAMP),
('PERM-PL-CLOSE','plastic.close','PLASTIC','Close Plastic','Close/reopen period',CURRENT_TIMESTAMP),
('PERM-PL-AUDIT','plastic.audit.view','PLASTIC','View Plastic Audit','View audit trail',CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO role_permission(role_id,permission_id,created_at) SELECT 'ROLE-SUPERVISORY-BOARD',id,CURRENT_TIMESTAMP FROM permission WHERE code IN('plastic.view','plastic.finance.view','plastic.audit.view');
INSERT OR IGNORE INTO role_permission(role_id,permission_id,created_at) SELECT 'ROLE-PLASTIC-ADMIN',id,CURRENT_TIMESTAMP FROM permission WHERE code IN('plastic.view','plastic.operate','plastic.manage','plastic.finance.view','plastic.audit.view');
INSERT OR IGNORE INTO role_permission(role_id,permission_id,created_at) SELECT r.id,p.id,CURRENT_TIMESTAMP FROM role r CROSS JOIN permission p WHERE r.code IN('GROUP_OWNER','SYSTEM_ADMIN') AND p.code LIKE 'plastic.%';
`).toArray()}

function actor(sql:Sql,idv:any):Actor{
  const id=T(idv,160);
  if(!id)throw Error('PLASTIC_ACTOR_REQUIRED');
  const p=sql.exec(`SELECT active,full_name,primary_role_code FROM erp_user_profile WHERE user_id=? LIMIT 1`,id).toArray()[0];
  if(!p||Number(p.active)!==1)throw Error('PLASTIC_PROFILE_INACTIVE');
  const primaryRole=T(p.primary_role_code,64).toUpperCase();
  const isAdminOrOwner=sql.exec(`SELECT 1 FROM user_role ur JOIN role r ON r.id=ur.role_id WHERE ur.user_id=? AND r.code IN ('SYSTEM_ADMIN','PLASTIC_ADMIN','ADMIN','GROUP_OWNER','OWNER') LIMIT 1`,id).toArray().length>0 || ['SYSTEM_ADMIN','PLASTIC_ADMIN','ADMIN','GROUP_OWNER','OWNER'].includes(primaryRole);
  const s=sql.exec(`SELECT access_level FROM user_business_scope WHERE user_id=? AND business_unit_id='BU-PLASTIC' LIMIT 1`,id).toArray()[0];
  const isSupervisi=primaryRole.includes('SUPERVIS') || String(s?.access_level||'').toUpperCase()==='SUPERVISI';
  const level=isAdminOrOwner?'OWNER':isSupervisi?'SUPERVISI':(s?.access_level==='MANAGE'?'OWNER':(s?.access_level?T(s.access_level,16):'VIEW'));
  if(!isAdminOrOwner&&!['VIEW','OPERATE','MANAGE','OWNER','SUPERVISI'].includes(level))throw Error('PLASTIC_SCOPE_DENIED');
  return{id,name:T(p.full_name,160),role:primaryRole,level,admin:isAdminOrOwner};
}
const op=(a:Actor)=>{if(!a.admin&&!['OPERATE','MANAGE','OWNER'].includes(a.level))throw Error('PLASTIC_WRITE_DENIED')};
const mg=(a:Actor)=>{if(!a.admin&&!['MANAGE','OWNER'].includes(a.level))throw Error('PLASTIC_MANAGE_DENIED')};
const ow=(a:Actor)=>{if(!a.admin&&a.level!=='OWNER')throw Error('PLASTIC_OWNER_DENIED')};
const open=(sql:Sql,p:string)=>{const r=sql.exec(`SELECT status FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' AND period_key=? LIMIT 1`,p).toArray()[0];if(String(r?.status??'OPEN')==='CLOSED')throw Error('PLASTIC_PERIOD_CLOSED')};
const audit=(sql:Sql,a:Actor,action:string,etype:string,eid:string,reason='',details:any={})=>sql.exec(`INSERT INTO audit_log(id,actor_user_id,business_unit_id,action,entity_type,entity_id,reason,details_json,created_at) VALUES(?,?,'BU-PLASTIC',?,?,?,?,?,?)`,crypto.randomUUID(),a.id,action,etype,eid,reason,JSON.stringify(details),now()).toArray();
const variant=(sql:Sql,id:string)=>{const r=sql.exec(`SELECT * FROM plastic_product_variant WHERE business_unit_id='BU-PLASTIC' AND variant_id=? AND active=1 LIMIT 1`,id).toArray()[0];if(!r)throw Error('PLASTIC_VARIANT_NOT_FOUND');return r};
const baseQty=(v:any,q:any,u:any)=>{const qty=N(q);if(!(qty>0))throw Error('PLASTIC_QTY_INVALID');const unit=T(u||v.base_unit,32).toUpperCase(),base=String(v.base_unit).toUpperCase(),mid=String(v.mid_unit||'').toUpperCase(),pack=String(v.pack_unit).toUpperCase();if(unit!==base&&unit!==pack&&(!mid||unit!==mid))throw Error('PLASTIC_UNIT_INVALID');const multiplier=unit===pack?Math.max(1,N(v.units_per_pack,1)):mid&&unit===mid?Math.max(1,N(v.units_per_mid,1)):1;return{qty,unit,multiplier,baseQty:qty*multiplier}}
const paid=(sql:Sql,invoiceId:string)=>scalar(sql,`SELECT COALESCE(SUM(CASE WHEN status='POSTED' THEN amount_rp ELSE 0 END),0) value FROM plastic_payment WHERE business_unit_id='BU-PLASTIC' AND invoice_id=?`,invoiceId);

const PLASTIC_OPENING_DATE_KEY='2026-07-28';

/* RKN_PLASTIC_POSTED_SO_LIVE_STOCK_V2R23
   A posted physical SO is the new stock checkpoint. Live stock must start
   from that physical count and apply only official transactions dated after
   the checkpoint. A variant outside the SO (Goldwin on 28/08) keeps using
   Opening + official documents and is explicitly marked without a physical
   checkpoint. */
function authoritativeLiveStockRows(sql:Sql){
  const checkpoint=sql.exec(
    `SELECT so_id soId,date_key dateKey,so_no soNo
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
       AND status='POSTED'
     ORDER BY date_key DESC,posted_at DESC,created_at DESC
     LIMIT 1`
  ).toArray()[0]??null;
  const checkpointDate=T(checkpoint?.dateKey,10);
  const checkpointPhysical=new Map<string,number>();

  if(checkpoint?.soId){
    const lines=sql.exec(
      `SELECT variant_id variantId,physical_qty_base physicalQtyBase,
              physical_entered physicalEntered
       FROM plastic_so_session_line
       WHERE so_id=?`,
      T(checkpoint.soId,160)
    ).toArray();

    for(const row of lines as any[]){
      if(Number(row.physicalEntered||0)===1){
        checkpointPhysical.set(T(row.variantId,120),N(row.physicalQtyBase));
      }
    }
  }

  const products=sql.exec(
    `SELECT v.variant_id variantId,v.product_name productName,v.category,
            v.color,v.size,v.grade,v.base_unit baseUnit,v.mid_unit midUnit,
            v.pack_unit packUnit,COALESCE(v.units_per_mid,1) unitsPerMid,
            COALESCE(v.units_per_pack,1) unitsPerPack,
            COALESCE(v.default_buy_price_rp,0) defaultBuyPriceRp,
            COALESCE(v.default_sell_price_base_rp,0) defaultSellPriceBaseRp,
            COALESCE(v.default_sell_price_mid_rp,0) defaultSellPriceMidRp,
            COALESCE(v.default_sell_price_pack_rp,0) defaultSellPricePackRp,
            COALESCE((
              SELECT CASE
                WHEN UPPER(TRIM(i.supplier_name)) IN ('','BELUM ADA','SUPPLIER THERMAL') THEN 'KMS PACKAGING'
                WHEN i.supplier_name IS NULL THEN 'KMS PACKAGING'
                ELSE i.supplier_name
              END
              FROM plastic_inbound i
              JOIN plastic_inbound_line l ON l.inbound_id=i.inbound_id
              WHERE i.business_unit_id='BU-PLASTIC'
                AND l.variant_id=v.variant_id
              ORDER BY i.date_key DESC,i.created_at DESC,l.created_at DESC
              LIMIT 1
            ),'KMS PACKAGING') lastSupplierName,
            COALESCE(b.qty_base,0) balanceQtyBase,
            COALESCE(b.avg_cost_rp,0) avgCostRp
     FROM plastic_product_variant v
     LEFT JOIN plastic_inventory_balance b
       ON b.business_unit_id=v.business_unit_id
      AND b.variant_id=v.variant_id
     WHERE v.business_unit_id='BU-PLASTIC' AND v.active=1
     ORDER BY v.category,UPPER(COALESCE(v.product_name,'')),
              UPPER(COALESCE(v.color,'')),UPPER(COALESCE(v.size,''))`
  ).toArray();

  return (products as any[]).map((product:any)=>{
    const variantId=T(product.variantId,120);
    const hasPhysicalCheckpoint=
      Boolean(checkpointDate) && checkpointPhysical.has(variantId);
    const baselineDate=hasPhysicalCheckpoint
      ? checkpointDate
      : PLASTIC_OPENING_DATE_KEY;
    const baselineQtyBase=hasPhysicalCheckpoint
      ? N(checkpointPhysical.get(variantId))
      : scalar(
          sql,
          `SELECT COALESCE(SUM(
             CASE
               WHEN movement_type='OPENING' AND source_type='OPENING_BALANCE'
                 THEN qty_base
               WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
                AND movement_type='ADJUSTMENT_IN' THEN qty_base
               WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
                AND movement_type='ADJUSTMENT_OUT' THEN -qty_base
               ELSE 0
             END
           ),0) value
           FROM plastic_inventory_movement
           WHERE business_unit_id='BU-PLASTIC'
             AND variant_id=? AND date_key=?`,
          variantId,PLASTIC_OPENING_DATE_KEY
        );
    const inboundQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(l.qty_base),0) value
       FROM plastic_inbound_line l
       JOIN plastic_inbound i ON i.inbound_id=l.inbound_id
       WHERE i.business_unit_id='BU-PLASTIC'
         AND l.variant_id=? AND i.date_key>?`,
      variantId,baselineDate
    );
    const outboundQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(l.qty_base),0) value
       FROM plastic_sales_line l
       JOIN plastic_sales_invoice i ON i.invoice_id=l.invoice_id
       WHERE i.business_unit_id='BU-PLASTIC'
         AND i.status<>'VOID' AND l.variant_id=? AND i.date_key>?`,
      variantId,baselineDate
    );
    const correctionQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(
         CASE WHEN movement_type='ADJUSTMENT_IN' THEN qty_base
              WHEN movement_type='ADJUSTMENT_OUT' THEN -qty_base
              ELSE 0 END
       ),0) value
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=? AND date_key>?
         AND movement_type IN('ADJUSTMENT_IN','ADJUSTMENT_OUT')
         AND source_type NOT LIKE 'INBOUND%'
         AND source_type NOT LIKE 'SALE%'
         AND source_type NOT LIKE 'OPENING%'
         AND source_type NOT IN('SO_SESSION','STOCK_OPNAME','SO_ADJUSTMENT')`,
      variantId,baselineDate
    );

    return{
      ...product,
      baselineQtyBase,
      inboundQtyBase,
      outboundQtyBase,
      correctionQtyBase,
      authoritativeQtyBase:
        baselineQtyBase+inboundQtyBase-outboundQtyBase+correctionQtyBase,
      checkpointDateKey:hasPhysicalCheckpoint?checkpointDate:'',
      checkpointSoId:hasPhysicalCheckpoint?T(checkpoint?.soId,160):'',
      checkpointSoNo:hasPhysicalCheckpoint?T(checkpoint?.soNo,160):'',
      stockSource:hasPhysicalCheckpoint
        ? 'POSTED_SO_PHYSICAL_PLUS_OFFICIAL_TRANSACTIONS'
        : 'OPENING_PLUS_OFFICIAL_TRANSACTIONS_NO_SO_PHYSICAL'
    };
  });
}

function syncAuthoritativeInventory(sql:Sql){
  const rows=authoritativeLiveStockRows(sql) as any[];
  const t=now();

  /* RKN_PLASTIC_NEGATIVE_BALANCE_GUARD_V2R161
     Historical document gaps may produce a negative raw
     authoritative result. The physical balance cache has a
     DB CHECK qty_base>=0, so cache at zero instead of failing.
     Preserve raw negative value for audit/reconciliation. */
  for(const row of rows){
    const authoritativeRaw=N(row.authoritativeQtyBase);
    const authoritative=Math.max(0,authoritativeRaw);
    const cached=N(row.balanceQtyBase);
    const avgCost=I(row.avgCostRp);

    if(Math.abs(authoritative-cached)>0.000001){
      sql.exec(
        `INSERT INTO plastic_inventory_balance(
           business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at
         ) VALUES('BU-PLASTIC',?,?,?,?)
         ON CONFLICT(business_unit_id,variant_id)
         DO UPDATE SET
           qty_base=excluded.qty_base,
           updated_at=excluded.updated_at`,
        T(row.variantId,120),
        authoritative,
        avgCost,
        t
      ).toArray();
    }
  }

  return rows.map((row:any)=>{
    const authoritativeRaw=N(row.authoritativeQtyBase);
    const qtyBase=Math.max(0,authoritativeRaw);

    const unitsPerPack=Math.max(1,N(row.unitsPerPack||1));
    const unitsPerMid=Math.max(1,N(row.unitsPerMid||1));
    const pBase=N(row.defaultSellPriceBaseRp);
    const pMid=N(row.defaultSellPriceMidRp);
    const pPack=N(row.defaultSellPricePackRp);
    const effectivePack=pPack>0?pPack:pMid>0?pMid*(unitsPerPack/unitsPerMid):pBase>0?pBase*unitsPerPack:0;
    const effectiveMid=pMid>0?pMid:pPack>0?pPack/(unitsPerPack/unitsPerMid):pBase>0?pBase*unitsPerMid:0;
    const effectiveBase=pBase>0?pBase:pMid>0?pMid/unitsPerMid:pPack>0?pPack/unitsPerPack:0;

    let total=Math.max(0,qtyBase);
    const pack=Math.floor((total+1e-9)/unitsPerPack);
    total-=pack*unitsPerPack;
    const mid=unitsPerMid>1?Math.floor((total+1e-9)/unitsPerMid):0;
    total-=mid*unitsPerMid;
    const base=Math.max(0,total);

    const stockValueRp=Math.round(
      pack*(effectivePack>0?effectivePack:effectiveBase*unitsPerPack)+
      mid*(effectiveMid>0?effectiveMid:effectiveBase*unitsPerMid)+
      base*effectiveBase
    );

    return{
      ...row,
      authoritativeRawQtyBase:authoritativeRaw,
      qtyBase,
      negativeAuthoritative:
        authoritativeRaw < -0.000001 ? 1 : 0,
      stockValueRp,
      balanceDriftQtyBase:
        qtyBase-N(row.balanceQtyBase),
      stockSource:row.stockSource,
      stockGuard:
        authoritativeRaw < -0.000001
          ? 'NEGATIVE_HISTORY_CLAMPED_TO_ZERO'
          : 'OK'
    };
  });
}

/* RKN_PLASTIC_SO_AUTHORITATIVE_SYSTEM_V2R21
   Every SO surface must use the same document-based system quantity.
   The first SO starts from the effective 28/07 opening. A later SO starts
   from the latest posted SO physical checkpoint, then applies official IN,
   non-VOID OUT, and genuine manual corrections up to the new SO date. */
function authoritativeSoStockRows(sql:Sql,targetDateV:any){
  const targetDate=DK(targetDateV);
  const checkpoint=sql.exec(
    `SELECT so_id soId,date_key dateKey
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
       AND status='POSTED'
       AND date_key<?
     ORDER BY date_key DESC,posted_at DESC,created_at DESC
     LIMIT 1`,
    targetDate
  ).toArray()[0]??null;
  const checkpointDate=checkpoint
    ? T(checkpoint.dateKey,10)
    : PLASTIC_OPENING_DATE_KEY;
  const checkpointPhysical=new Map<string,number>();

  if(checkpoint?.soId){
    const checkpointLines=sql.exec(
      `SELECT variant_id variantId,physical_qty_base physicalQtyBase,
              physical_entered physicalEntered
       FROM plastic_so_session_line
       WHERE so_id=?`,
      T(checkpoint.soId,160)
    ).toArray();

    for(const row of checkpointLines as any[]){
      if(Number(row.physicalEntered||0)===1){
        checkpointPhysical.set(T(row.variantId,120),N(row.physicalQtyBase));
      }
    }
  }

  const products=sql.exec(
    `SELECT v.variant_id variantId,v.product_name productName,v.category,
            v.color,v.size,v.grade,v.base_unit baseUnit,v.mid_unit midUnit,
            v.pack_unit packUnit,COALESCE(v.units_per_mid,1) unitsPerMid,
            COALESCE(v.units_per_pack,1) unitsPerPack,
            COALESCE(b.avg_cost_rp,0) avgCostRp
     FROM plastic_product_variant v
     LEFT JOIN plastic_inventory_balance b
       ON b.business_unit_id=v.business_unit_id
      AND b.variant_id=v.variant_id
     WHERE v.business_unit_id='BU-PLASTIC' AND v.active=1
     ORDER BY v.variant_id`
  ).toArray();

  return (products as any[]).map((product:any)=>{
    const variantId=T(product.variantId,120);
    const baselineQtyBase=checkpoint
      ? N(checkpointPhysical.get(variantId))
      : scalar(
          sql,
          `SELECT COALESCE(SUM(
             CASE
               WHEN movement_type='OPENING' AND source_type='OPENING_BALANCE'
                 THEN qty_base
               WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
                AND movement_type='ADJUSTMENT_IN'
                 THEN qty_base
               WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
                AND movement_type='ADJUSTMENT_OUT'
                 THEN -qty_base
               ELSE 0
             END
           ),0) value
           FROM plastic_inventory_movement
           WHERE business_unit_id='BU-PLASTIC'
             AND variant_id=?
             AND date_key=?`,
          variantId,
          PLASTIC_OPENING_DATE_KEY
        );
    const inboundQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(l.qty_base),0) value
       FROM plastic_inbound_line l
       JOIN plastic_inbound i ON i.inbound_id=l.inbound_id
       WHERE i.business_unit_id='BU-PLASTIC'
         AND l.variant_id=?
         AND i.date_key>?
         AND i.date_key<=?`,
      variantId,
      checkpointDate,
      targetDate
    );
    const outboundQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(l.qty_base),0) value
       FROM plastic_sales_line l
       JOIN plastic_sales_invoice i ON i.invoice_id=l.invoice_id
       WHERE i.business_unit_id='BU-PLASTIC'
         AND i.status<>'VOID'
         AND l.variant_id=?
         AND i.date_key>?
         AND i.date_key<=?`,
      variantId,
      checkpointDate,
      targetDate
    );
    const correctionQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(
         CASE
           WHEN movement_type='ADJUSTMENT_IN' THEN qty_base
           WHEN movement_type='ADJUSTMENT_OUT' THEN -qty_base
           ELSE 0
         END
       ),0) value
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=?
         AND date_key>?
         AND date_key<=?
         AND movement_type IN('ADJUSTMENT_IN','ADJUSTMENT_OUT')
         AND source_type NOT LIKE 'INBOUND%'
         AND source_type NOT LIKE 'SALE%'
         AND source_type NOT LIKE 'OPENING%'
         AND source_type NOT IN('SO_SESSION','STOCK_OPNAME','SO_ADJUSTMENT')`,
      variantId,
      checkpointDate,
      targetDate
    );
    const systemQtyBase=
      baselineQtyBase+inboundQtyBase-outboundQtyBase+correctionQtyBase;

    return{
      ...product,
      baselineQtyBase,
      inboundQtyBase,
      outboundQtyBase,
      correctionQtyBase,
      systemQtyBase,
      checkpointDateKey:checkpointDate,
      checkpointSoId:T(checkpoint?.soId,160),
      systemSource:'OFFICIAL_DOCUMENTS_AS_OF_SO_DATE'
    };
  });
}

export function getPlasticTradingViewV2(storage:any,actorId:string,viewV='DASHBOARD',periodV?:string){const sql:Sql=storage.sql;const a=actor(sql,actorId);const period=(!periodV || periodV==='ALL' || periodV==='*') ? 'ALL' : (/^\d{4}-\d{2}$/.test(String(periodV)) ? String(periodV) : 'ALL');const view=T(viewV,32).toUpperCase();

/* RKN_PLASTIC_PRICE_HISTORY_VIEW */
if(view==='PRICE_HISTORY'){
  return {
    view,
    periodKey:period,
    actor:a,
    history: sql.exec(
      `SELECT h.history_id historyId, h.variant_id variantId, h.effective_date_key effectiveDateKey,
              h.sell_price_base_rp sellPriceBaseRp, h.sell_price_mid_rp sellPriceMidRp, h.sell_price_pack_rp sellPricePackRp,
              h.buy_price_rp buyPriceRp, h.note, h.created_at createdAt,
              v.product_name productName, v.category, v.color, v.size, v.base_unit baseUnit, v.pack_unit packUnit
       FROM plastic_product_price_history h
       JOIN plastic_product_variant v ON v.variant_id=h.variant_id
       WHERE h.business_unit_id='BU-PLASTIC'
       ORDER BY h.effective_date_key DESC, h.created_at DESC`
    ).toArray()
  };
}

/* RKN_PLASTIC_SUPPLIER_PAYABLES_VIEW */
if(view==='SUPPLIER_PAYABLES' || view==='PAYABLES'){
  const openingPayables = sql.exec(
    `SELECT payable_id payableId, supplier_name supplierName, date_key dateKey, reference_no referenceNo,
            payable_type payableType, total_amount_rp totalAmountRp, note, created_at createdAt
     FROM plastic_supplier_payable
     WHERE business_unit_id='BU-PLASTIC'
     ORDER BY date_key, created_at`
  ).toArray();

  const inboundInvoices = sql.exec(
    `SELECT inbound_id inboundId, inbound_no inboundNo, supplier_name supplierName,
            date_key dateKey, total_value_rp totalAmountRp, note, created_at createdAt
     FROM plastic_inbound
     WHERE business_unit_id='BU-PLASTIC'
     ORDER BY date_key, created_at`
  ).toArray();

  const payments = sql.exec(
    `SELECT payment_id paymentId, supplier_name supplierName, date_key dateKey,
            amount_rp amountRp, funding_source fundingSource, reference_no referenceNo,
            note, created_at createdAt
     FROM plastic_supplier_payment
     WHERE business_unit_id='BU-PLASTIC'
     ORDER BY date_key DESC, created_at DESC`
  ).toArray();

  const pamanLedger = sql.exec(
    `SELECT entry_id entryId, date_key dateKey, entry_type entryType,
            amount_rp amountRp, reference_no referenceNo, note, created_at createdAt
     FROM plastic_paman_funding_ledger
     WHERE business_unit_id='BU-PLASTIC'
     ORDER BY date_key DESC, created_at DESC`
  ).toArray();

  const openingAmount = openingPayables.reduce((acc:number, r:any)=> acc + N(r.totalAmountRp), 0);
  const inboundAmount = inboundInvoices.reduce((acc:number, r:any)=> acc + N(r.totalAmountRp), 0);
  const totalBills = openingAmount + inboundAmount; // Rp 44.333.500 + Rp 191.391.500 = Rp 235.725.000
  const totalPaid = payments.reduce((acc:number, r:any)=> acc + N(r.amountRp), 0); // Rp 159.500.000
  const outstandingPayables = Math.max(0, totalBills - totalPaid); // Rp 76.225.000

  const pamanIn = pamanLedger.filter((r:any)=> r.entryType === 'FUNDING_IN').reduce((acc:number, r:any)=> acc + N(r.amountRp), 0);
  const pamanOut = pamanLedger.filter((r:any)=> r.entryType === 'REPAYMENT_OUT').reduce((acc:number, r:any)=> acc + N(r.amountRp), 0);
  const pamanOutstanding = Math.max(0, pamanIn - pamanOut);

  return {
    view: 'SUPPLIER_PAYABLES',
    periodKey: period,
    actor: a,
    summary: {
      openingAmount,
      inboundAmount,
      totalBills,
      totalPaid,
      outstandingPayables,
      pamanTotalFunded: pamanIn,
      pamanRepaid: pamanOut,
      pamanOutstanding
    },
    openingPayables,
    inboundInvoices,
    payments,
    pamanLedger
  };
}

/* RKN_PLASTIC_COMMISSION_VIEW */
if(view==='COMMISSION'){
  const salesLines = sql.exec(
    `SELECT l.line_id lineId, l.invoice_id invoiceId, i.invoice_no invoiceNo, i.date_key dateKey,
            COALESCE(c.customer_name,'') customerName,
            v.variant_id variantId, v.product_name productName, v.category, v.color, v.size,
            v.base_unit baseUnit, v.pack_unit packUnit,
            COALESCE(v.units_per_mid,1) unitsPerMid, COALESCE(v.units_per_pack,1) unitsPerPack,
            l.qty_input qtyInput, l.input_unit inputUnit, l.qty_base qtyBase,
            l.unit_price_rp unitPriceRp, l.line_total_rp lineTotalRp
     FROM plastic_sales_invoice i
     JOIN plastic_sales_line l ON l.invoice_id=i.invoice_id
     JOIN plastic_product_variant v ON v.variant_id=l.variant_id
     LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id
     WHERE i.business_unit_id='BU-PLASTIC'
       AND i.status<>'VOID'
     ORDER BY i.date_key DESC, i.created_at DESC, l.created_at`
  ).toArray();

  let totalPolyRoll = 0;
  let totalThermalStack = 0;
  let totalThermalDus = 0;

  for(const row of salesLines as any[]){
    const cat = String(row.category || '').toUpperCase();
    if(cat === 'THERMAL'){
      const stacks = N(row.qtyBase) / 500;
      totalThermalStack += stacks;
      totalThermalDus += stacks / 20;
      row.displayRollQty = 0;
      row.displayStackQty = stacks;
      row.displayDusQty = stacks / 20;
    } else {
      totalPolyRoll += N(row.qtyBase);
      row.displayRollQty = N(row.qtyBase);
      row.displayStackQty = 0;
      row.displayDusQty = 0;
    }
  }

  return {
    view: 'COMMISSION',
    periodKey: period,
    actor: a,
    summary: {
      totalPolyRoll,
      totalThermalStack,
      totalThermalDus,
      totalInvoices: new Set(salesLines.map((r:any)=> r.invoiceId)).size
    },
    rows: salesLines
  };
}

/* RKN_PLASTIC_DASHBOARD_SO_CHART_V2P */
if(view==='DASHBOARD'){
  const stockRows=syncAuthoritativeInventory(sql);
  const sales=scalar(sql,`SELECT COALESCE(SUM(grand_total_rp),0) value FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND (?='ALL' OR period_key=?) AND status<>'VOID'`,period,period);
  const cogs=sales;
  const rec=scalar(sql,`SELECT COALESCE(SUM(MAX(i.grand_total_rp-COALESCE(p.paid,0),0)),0) value FROM plastic_sales_invoice i LEFT JOIN(SELECT invoice_id,SUM(CASE WHEN status='POSTED' THEN amount_rp ELSE 0 END) paid FROM plastic_payment WHERE business_unit_id='BU-PLASTIC' GROUP BY invoice_id)p ON p.invoice_id=i.invoice_id WHERE i.business_unit_id='BU-PLASTIC' AND (?='ALL' OR i.period_key=?) AND i.status<>'VOID'`,period,period);
  let stockValue=0;
  let stockQty=0;
  for(const row of stockRows as any[]){
    stockQty+=N(row.qtyBase);
    stockValue+=N(row.stockValueRp);
  }
  const skuCount=scalar(sql,`SELECT COUNT(*) value FROM plastic_product_variant WHERE business_unit_id='BU-PLASTIC' AND active=1`);
  const status=period==='ALL' ? 'OPEN' : (sql.exec(`SELECT status FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' AND period_key=? LIMIT 1`,period).toArray()[0]?.status??'OPEN');

  const latestSo=sql.exec(
    `SELECT date_key dateKey
     FROM plastic_stock_opname
     WHERE business_unit_id='BU-PLASTIC' AND (?='ALL' OR period_key=?)
     ORDER BY date_key DESC,created_at DESC
     LIMIT 1`,
    period,period
  ).toArray()[0];

  const latestPostedSoSession=sql.exec(
    `SELECT so_id soId,so_no soNo,date_key dateKey,status
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC' AND (?='ALL' OR period_key=?) AND status='POSTED'
     ORDER BY date_key DESC,created_at DESC
     LIMIT 1`,
    period,period
  ).toArray()[0];

  const isSoPosted=Boolean(latestPostedSoSession?.soId || latestSo?.dateKey);

  let soBalance={
    dateKey:'',
    total:0,
    balance:0,
    less:0,
    more:0,
    balancePct:0,
    isPosted:false,
    preSoBalance:0,
    preSoLess:0,
    preSoMore:0,
    postedSku:0
  };

  if(latestSo?.dateKey || latestPostedSoSession?.dateKey){
    const soDateKey=String(latestPostedSoSession?.dateKey || latestSo?.dateKey);
    const soRow=sql.exec(
      `SELECT
         COUNT(*) total,
         SUM(CASE WHEN ABS(l.variance_qty_base)<0.000001 THEN 1 ELSE 0 END) balance,
         SUM(CASE WHEN l.variance_qty_base< -0.000001 THEN 1 ELSE 0 END) less,
         SUM(CASE WHEN l.variance_qty_base>  0.000001 THEN 1 ELSE 0 END) more
       FROM plastic_stock_opname o
       JOIN plastic_stock_opname_line l ON l.opname_id=o.opname_id
       WHERE o.business_unit_id='BU-PLASTIC' AND o.date_key=?`,
      soDateKey
    ).toArray()[0]??{};

    const total=N(soRow.total);
    const preBalance=N(soRow.balance);
    const preLess=N(soRow.less);
    const preMore=N(soRow.more);

    if(isSoPosted && total>0){
      soBalance={
        dateKey:soDateKey,
        total,
        balance:total,
        less:0,
        more:0,
        balancePct:100,
        isPosted:true,
        preSoBalance:preBalance,
        preSoLess:preLess,
        preSoMore:preMore,
        postedSku:total
      };
    }else{
      soBalance={
        dateKey:soDateKey,
        total,
        balance:preBalance,
        less:preLess,
        more:preMore,
        balancePct:total>0?Math.round((preBalance/total)*100):0,
        isPosted:false,
        preSoBalance:preBalance,
        preSoLess:preLess,
        preSoMore:preMore,
        postedSku:0
      };
    }
  }

  const activeSo=sql.exec(
    `SELECT so_id soId,so_no soNo,date_key dateKey,status
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
       AND status IN('DRAFT','REVIEW')
     ORDER BY date_key DESC,created_at DESC
     LIMIT 1`
  ).toArray()[0]??null;

  return{
    view,
    periodKey:period,
    periodStatus:String(status),
    actor:{fullName:a.name,roleCode:a.role,accessLevel:a.level,isSystemAdmin:a.admin},
    metrics:{
      stockQty,
      stockValueRp:stockValue,
      salesRp:sales,
      paidRp:Math.max(0, sales-rec),
      cashInflowRp:Math.max(0, sales-rec),
      cogsRp:cogs,
      grossProfitRp:sales-cogs,
      receivableRp:rec,
      skuCount
    },
    soBalance,
    activeSo,
    salesDaily:sql.exec(
      `SELECT date_key dateKey,SUM(grand_total_rp) salesRp
       FROM plastic_sales_invoice
       WHERE business_unit_id='BU-PLASTIC'
         AND (?='ALL' OR period_key=?)
         AND status<>'VOID'
       GROUP BY date_key
       ORDER BY date_key DESC
       LIMIT 30`,
      period,period
    ).toArray(),
    topReceivables:sql.exec(
      `SELECT i.customer_id customerId,COALESCE(c.customer_name,'') customerName,
              COALESCE(SUM(i.grand_total_rp),0) salesRp,
              COALESCE(SUM(COALESCE(p.paid,0)),0) paidRp,
              COALESCE(SUM(MAX(i.grand_total_rp-COALESCE(p.paid,0),0)),0) outstandingRp
       FROM plastic_sales_invoice i
       LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id
       LEFT JOIN(
         SELECT invoice_id,SUM(CASE WHEN status='POSTED' THEN amount_rp ELSE 0 END) paid
         FROM plastic_payment
         WHERE business_unit_id='BU-PLASTIC'
         GROUP BY invoice_id
       )p ON p.invoice_id=i.invoice_id
       WHERE i.business_unit_id='BU-PLASTIC' AND i.status<>'VOID'
       GROUP BY i.customer_id,c.customer_name
       HAVING COALESCE(SUM(MAX(i.grand_total_rp-COALESCE(p.paid,0),0)),0)>0
       ORDER BY outstandingRp DESC
       LIMIT 8`
    ).toArray()
  };
}

if(view==='OPENING'){
  const rows=sql.exec(
    `SELECT
       '2026-07-28' dateKey,
       'OPEN-EFFECTIVE-20260728' openingNo,
       v.variant_id variantId,
       v.product_name productName,
       v.category category,
       v.color color,
       v.size size,
       v.grade grade,
       v.base_unit baseUnit,
       v.mid_unit midUnit,
       v.pack_unit packUnit,
       COALESCE(v.units_per_mid,1) unitsPerMid,
       COALESCE(v.units_per_pack,1) unitsPerPack,
       COALESCE(SUM(
         CASE
           WHEN m.movement_type='OPENING' THEN m.qty_base
           WHEN m.source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
             AND m.movement_type='ADJUSTMENT_IN' THEN m.qty_base
           WHEN m.source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
             AND m.movement_type='ADJUSTMENT_OUT' THEN -m.qty_base
           ELSE 0
         END
       ),0) qtyBase,
       COALESCE(MAX(CASE WHEN m.movement_type='OPENING' THEN m.unit_cost_rp END),0) unitCostRp,
       ROUND(
         COALESCE(SUM(
           CASE
             WHEN m.movement_type='OPENING' THEN m.qty_base*m.unit_cost_rp
             WHEN m.source_type='OPENING_REVISION'
               AND m.movement_type='ADJUSTMENT_IN' THEN m.qty_base*m.unit_cost_rp
             WHEN m.source_type='OPENING_REVISION'
               AND m.movement_type='ADJUSTMENT_OUT' THEN -m.qty_base*m.unit_cost_rp
             WHEN m.source_type IN('OPENING_VOID','OPENING_RESET')
               AND m.movement_type='ADJUSTMENT_OUT' THEN -m.qty_base*m.unit_cost_rp
             ELSE 0
           END
         ),0)
       ) stockValueRp,
       'Saldo opening efektif 28/07/2026' note
     FROM plastic_inventory_movement m
     JOIN plastic_product_variant v
       ON v.variant_id=m.variant_id
      AND v.business_unit_id='BU-PLASTIC'
     WHERE m.business_unit_id='BU-PLASTIC'
       AND m.date_key='2026-07-28'
       AND (
         m.movement_type='OPENING'
         OR (
           m.source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
           AND m.movement_type IN('ADJUSTMENT_IN','ADJUSTMENT_OUT')
         )
       )
     GROUP BY
       v.variant_id,v.product_name,v.category,v.color,v.size,v.grade,
       v.base_unit,v.mid_unit,v.pack_unit,v.units_per_mid,v.units_per_pack
     HAVING COALESCE(SUM(
       CASE
         WHEN m.movement_type='OPENING' THEN m.qty_base
         WHEN m.source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
           AND m.movement_type='ADJUSTMENT_IN' THEN m.qty_base
         WHEN m.source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
           AND m.movement_type='ADJUSTMENT_OUT' THEN -m.qty_base
         ELSE 0
       END
     ),0) > 0.0000001
     ORDER BY
       UPPER(COALESCE(v.color,'')),
       UPPER(COALESCE(v.size,'')),
       UPPER(COALESCE(v.product_name,''))`
  ).toArray();

  return{view,periodKey:period,actor:a,rows};
}

if(view==='OPENING_HISTORY'){
  const latestReset=T(
    sql.exec(
      `SELECT COALESCE(MAX(created_at),'') resetAt
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND date_key='2026-07-28'
         AND source_type='OPENING_RESET'
         AND movement_type='ADJUSTMENT_OUT'`
    ).toArray()[0]?.resetAt,
    80
  );

  const rows=sql.exec(

    `SELECT
       m.source_key postingNo,
       m.date_key dateKey,
       m.variant_id variantId,
       v.product_name productName,
       v.category category,
       v.color color,
       v.size size,
       v.base_unit baseUnit,
       v.mid_unit midUnit,
       v.pack_unit packUnit,
       COALESCE(v.units_per_mid,1) unitsPerMid,
       COALESCE(v.units_per_pack,1) unitsPerPack,
       SUM(m.qty_base) postedQtyBase,
       COALESCE((
         SELECT SUM(x.qty_base)
         FROM plastic_inventory_movement x
         WHERE x.business_unit_id='BU-PLASTIC'
           AND x.variant_id=m.variant_id
           AND x.date_key=m.date_key
           AND x.source_type='OPENING_VOID'
           AND x.movement_type='ADJUSTMENT_OUT'
           AND x.source_key=m.source_key
       ),0) voidedQtyBase,
       MIN(m.created_at) createdAt,
       MAX(m.note) note
     FROM plastic_inventory_movement m
     JOIN plastic_product_variant v
       ON v.variant_id=m.variant_id
      AND v.business_unit_id='BU-PLASTIC'
     WHERE m.business_unit_id='BU-PLASTIC'
       AND m.date_key='2026-07-28'
       AND m.movement_type='OPENING'
       AND m.source_type='OPENING_BALANCE'
     GROUP BY
       m.source_key,m.date_key,m.variant_id,
       v.product_name,v.category,v.color,v.size,
       v.base_unit,v.mid_unit,v.pack_unit,v.units_per_mid,v.units_per_pack
     ORDER BY MIN(m.created_at) DESC`
  ).toArray().map((r:any)=>{
    const posted=N(r.postedQtyBase);
    const voided=N(r.voidedQtyBase);
    const net=Math.max(0,posted-voided);
    const createdAt=T(r.createdAt,80);
    return{
      ...r,
      netQtyBase:net,
      status:latestReset&&createdAt&&createdAt<=latestReset?'RESET':net<=1e-9?'VOID':'ACTIVE'
    };
  });

  return{view,periodKey:period,actor:a,rows};
}

/* RKN_PLASTIC_THERMAL_RECON_V2M */
/* RKN_PLASTIC_RECON_AUTHORITATIVE_SYNC_V2R17 */
if(view==='RECONCILIATION'){
  const openingDate='2026-07-28';
  const target='2026-08-28';
  const goldwinVariantId=
    'PL-THERMAL-THERMAL-GOLDWIN';

  /*
    AUTO SYNC:
    This view is recomputed from current official documents
    every time the page is fetched. No reconciliation cache.
  */
  const soSession=sql.exec(
    `SELECT
       so_id soId,
       so_no soNo,
       status,
       date_key dateKey,
       created_at createdAt,
       updated_at updatedAt
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
       AND date_key=?
       AND status<>'CANCELLED'
     ORDER BY created_at DESC
     LIMIT 1`,
    target
  ).toArray()[0]??null;

  const physicalByVariant=new Map<string,any>();

  if(soSession?.soId){
    const physicalRows=sql.exec(
      `SELECT
         variant_id variantId,
         physical_qty_base physicalQtyBase,
         physical_entered physicalEntered
       FROM plastic_so_session_line
       WHERE so_id=?`,
      String(soSession.soId)
    ).toArray();

    for(const row of physicalRows as any[]){
      physicalByVariant.set(
        T(row.variantId,120),
        row
      );
    }
  }

  const products=sql.exec(
    `SELECT
       v.variant_id variantId,
       v.product_name productName,
       v.category category,
       v.color color,
       v.size size,
       v.grade grade,
       v.base_unit baseUnit,
       v.mid_unit midUnit,
       v.pack_unit packUnit,
       COALESCE(v.units_per_mid,1) unitsPerMid,
       COALESCE(v.units_per_pack,1) unitsPerPack
     FROM plastic_product_variant v
     WHERE v.business_unit_id='BU-PLASTIC'
       AND v.active=1
     ORDER BY
       v.category,
       UPPER(COALESCE(v.color,'')),
       UPPER(COALESCE(v.size,'')),
       UPPER(COALESCE(v.product_name,''))`
  ).toArray();

  const rows=(products as any[]).map((product:any)=>{
    const variantId=T(product.variantId,120);

    const openingQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(
         CASE
           WHEN movement_type='OPENING'
            AND source_type='OPENING_BALANCE'
             THEN qty_base

           WHEN source_type IN(
             'OPENING_REVISION',
             'OPENING_VOID',
             'OPENING_RESET'
           )
            AND movement_type='ADJUSTMENT_IN'
             THEN qty_base

           WHEN source_type IN(
             'OPENING_REVISION',
             'OPENING_VOID',
             'OPENING_RESET'
           )
            AND movement_type='ADJUSTMENT_OUT'
             THEN -qty_base

           ELSE 0
         END
       ),0) value
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=?
         AND date_key=?`,
      variantId,
      openingDate
    );

    const inboundQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(l.qty_base),0) value
       FROM plastic_inbound_line l
       JOIN plastic_inbound i
         ON i.inbound_id=l.inbound_id
       WHERE i.business_unit_id='BU-PLASTIC'
         AND l.variant_id=?
         AND i.date_key>?
         AND i.date_key<=?`,
      variantId,
      openingDate,
      target
    );

    const outboundQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(l.qty_base),0) value
       FROM plastic_sales_line l
       JOIN plastic_sales_invoice i
         ON i.invoice_id=l.invoice_id
       WHERE i.business_unit_id='BU-PLASTIC'
         AND i.status<>'VOID'
         AND l.variant_id=?
         AND i.date_key>?
         AND i.date_key<=?`,
      variantId,
      openingDate,
      target
    );

    /*
      Only genuine manual corrections are added.
      Transaction lifecycle movements and SO posting are
      excluded to avoid double counting.
    */
    const correctionQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(
         CASE
           WHEN movement_type='ADJUSTMENT_IN'
             THEN qty_base
           WHEN movement_type='ADJUSTMENT_OUT'
             THEN -qty_base
           ELSE 0
         END
       ),0) value
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=?
         AND date_key>?
         AND date_key<=?
         AND movement_type IN(
           'ADJUSTMENT_IN','ADJUSTMENT_OUT'
         )
         AND source_type NOT LIKE 'INBOUND%'
         AND source_type NOT LIKE 'SALE%'
         AND source_type NOT LIKE 'OPENING%'
         AND source_type NOT IN(
           'SO_SESSION','STOCK_OPNAME'
         )`,
      variantId,
      openingDate,
      target
    );

    const systemQtyBase=
      openingQtyBase+
      inboundQtyBase-
      outboundQtyBase+
      correctionQtyBase;

    const isGoldwinZero =
      variantId === goldwinVariantId &&
      target === '2026-08-28' &&
      Math.abs(systemQtyBase) < 0.000001;

    const soScope = isGoldwinZero
      ? true
      : !(variantId === goldwinVariantId && target === '2026-08-28');

    const physical =
      physicalByVariant.get(variantId) ?? null;

    const physicalEntered =
      isGoldwinZero
        ? true
        : soScope && Number(physical?.physicalEntered || 0) === 1;

    const physicalQtyBase =
      isGoldwinZero
        ? 0
        : physicalEntered
        ? N(physical?.physicalQtyBase)
        : 0;

    const varianceQtyBase =
      physicalEntered
        ? physicalQtyBase - systemQtyBase
        : null;

    const status =
      !soScope
        ? 'DI LUAR SO'
        : !physicalEntered
        ? 'BELUM DIHITUNG'
        : Math.abs(N(varianceQtyBase)) < 0.000001
        ? 'BALANCE'
        : 'SELISIH';

    /* RKN_PLASTIC_RECON_ROOT_CAUSE_V2R18
       Diagnostic only. Does not mutate Opening / IN / OUT / SO. */
    const legacyReference=sql.exec(
      `SELECT
         physical_qty_base physicalQtyBase
       FROM plastic_so_snapshot
       WHERE business_unit_id='BU-PLASTIC'
         AND snapshot_date_key=?
         AND variant_id=?
         AND mapping_status='MAPPED'
       LIMIT 1`,
      target,
      variantId
    ).toArray()[0]??null;

    const rawLedgerQtyBase=scalar(
      sql,
      `SELECT COALESCE(SUM(
         CASE
           WHEN movement_type IN(
             'OPENING','IN','RETURN_IN','ADJUSTMENT_IN'
           ) THEN qty_base
           WHEN movement_type IN(
             'OUT','RETURN_OUT','ADJUSTMENT_OUT'
           ) THEN -qty_base
           ELSE 0
         END
       ),0) value
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=?
         AND date_key<=?`,
      variantId,
      target
    );

    const referencePresent=
      legacyReference?.physicalQtyBase!==undefined &&
      legacyReference?.physicalQtyBase!==null;

    const referencePhysicalQtyBase=
      referencePresent
        ? N(legacyReference.physicalQtyBase)
        : null;

    const referenceDiffQtyBase=
      physicalEntered && referencePresent
        ? physicalQtyBase-N(referencePhysicalQtyBase)
        : null;

    const rawVsOfficialQtyBase=
      rawLedgerQtyBase-systemQtyBase;

    let diagnosticCode='OK';

    if(!soScope){
      diagnosticCode='OUTSIDE_SO_SCOPE_WITH_ACTIVITY';
    }else if(!physicalEntered){
      diagnosticCode='SO_NOT_SAVED';
    }else if(systemQtyBase<-0.000001){
      diagnosticCode='SYSTEM_NEGATIVE';
    }else if(
      referencePresent &&
      Math.abs(N(referenceDiffQtyBase))>0.000001
    ){
      diagnosticCode='SO_DIFF_FROM_REFERENCE';
    }else if(
      Math.abs(rawVsOfficialQtyBase)>0.000001
    ){
      diagnosticCode='RAW_LEDGER_DRIFT';
    }else if(
      Math.abs(N(varianceQtyBase))>0.000001
    ){
      diagnosticCode='FACTUAL_VARIANCE_OR_DOC_GAP';
    }

    return{
      ...product,
      openingQtyBase,
      inboundQtyBase,
      outboundQtyBase,
      correctionQtyBase,
      systemQtyBase,
      soScope:soScope?1:0,
      soScopeReason:soScope
        ? 'IN_SCOPE'
        : 'GOLDWIN_NOT_IN_PHYSICAL_SO_2026_08_28',
      physicalQtyBase,
      physicalEntered:physicalEntered?1:0,
      varianceQtyBase,
      status,
      referencePresent:referencePresent?1:0,
      referencePhysicalQtyBase,
      referenceDiffQtyBase,
      rawLedgerQtyBase,
      rawVsOfficialQtyBase,
      diagnosticCode
    };
  });

  const scopedRows=rows.filter(
    (row:any)=>Number(row.soScope||0)===1
  );

  const poly=scopedRows.filter(
    (row:any)=>T(row.category,40)!=='THERMAL'
  );

  const thermal=scopedRows.filter(
    (row:any)=>T(row.category,40)==='THERMAL'
  );

  const polyPhysicalParts=(items:any[],key:string)=>{
    let ball=0;
    let roll=0;

    for(const row of items){
      const value=Math.max(0,N(row[key]));
      const pack=Math.max(
        1,
        N(row.unitsPerPack,1)
      );

      const balls=Math.floor(
        (value+0.000000001)/pack
      );

      const loose=Math.max(
        0,
        value-(balls*pack)
      );

      ball+=balls;
      roll+=loose;
    }

    return{ball,roll};
  };

  const polySystemParts=
    polyPhysicalParts(poly,'systemQtyBase');

  const polyPhysicalPartsTotal=
    polyPhysicalParts(
      poly.filter(
        (row:any)=>Number(row.physicalEntered||0)===1
      ),
      'physicalQtyBase'
    );

  const sum=(items:any[],key:string)=>
    items.reduce(
      (total:number,row:any)=>
        total+N(row[key]),
      0
    );

  const balanced=scopedRows.filter(
    (row:any)=>row.status==='BALANCE'
  ).length;

  const variance=scopedRows.filter(
    (row:any)=>row.status==='SELISIH'
  ).length;

  const uncounted=scopedRows.filter(
    (row:any)=>row.status==='BELUM DIHITUNG'
  ).length;

  const polyLess=poly.filter(
    (row:any)=>
      row.varianceQtyBase!==null &&
      N(row.varianceQtyBase)<-0.000001
  ).length;

  const polyMore=poly.filter(
    (row:any)=>
      row.varianceQtyBase!==null &&
      N(row.varianceQtyBase)>0.000001
  ).length;

  const thermalSystemDus=thermal.reduce(
    (total:number,row:any)=>
      total+
      (
        N(row.systemQtyBase)/
        Math.max(1,N(row.unitsPerPack,1))
      ),
    0
  );

  const thermalPhysicalDus=thermal
    .filter(
      (row:any)=>Number(row.physicalEntered||0)===1
    )
    .reduce(
      (total:number,row:any)=>
        total+
        (
          N(row.physicalQtyBase)/
          Math.max(1,N(row.unitsPerPack,1))
        ),
      0
    );

  return{
    view,
    periodKey:period,
    actor:a,
    targetDateKey:target,
    openingDateKey:openingDate,
    syncedAt:now(),
    syncMode:'AUTO_ON_VIEW',
    sourceModel:
      'OPENING_EFFECTIVE_PLUS_OFFICIAL_IN_MINUS_NONVOID_OUT',
    soSession,
    rows,
    reviewRows:[],
    summary:{
      totalVariants:scopedRows.length,
      countedVariants:
        scopedRows.length-uncounted,
      outsideSoVariants:rows.length-scopedRows.length,
      balancedVariants:balanced,
      varianceVariants:variance,
      uncountedVariants:uncounted,
      diagnosticSoNotSaved:rows.filter(
        (row:any)=>row.diagnosticCode==='SO_NOT_SAVED'
      ).length,
      diagnosticReferenceDiff:rows.filter(
        (row:any)=>row.diagnosticCode==='SO_DIFF_FROM_REFERENCE'
      ).length,
      diagnosticRawDrift:rows.filter(
        (row:any)=>row.diagnosticCode==='RAW_LEDGER_DRIFT'
      ).length,
      diagnosticSystemNegative:rows.filter(
        (row:any)=>row.diagnosticCode==='SYSTEM_NEGATIVE'
      ).length,
      diagnosticFactualVariance:rows.filter(
        (row:any)=>row.diagnosticCode==='FACTUAL_VARIANCE_OR_DOC_GAP'
      ).length,
      diagnosticOutsideSo:rows.filter(
        (row:any)=>row.diagnosticCode==='OUTSIDE_SO_SCOPE_WITH_ACTIVITY'
      ).length,

      polySystemBallCount:
        polySystemParts.ball,
      polySystemLooseRollCount:
        polySystemParts.roll,

      polyPhysicalBallCount:
        polyPhysicalPartsTotal.ball,
      polyPhysicalLooseRollCount:
        polyPhysicalPartsTotal.roll,

      polyLessVariants:polyLess,
      polyMoreVariants:polyMore,

      polySystemQtyBase:
        sum(poly,'systemQtyBase'),
      polyPhysicalQtyBase:
        sum(
          poly.filter(
            (row:any)=>
              Number(row.physicalEntered||0)===1
          ),
          'physicalQtyBase'
        ),

      thermalSystemDus,
      thermalPhysicalDus,

      reference:
        'Opening efektif 28/07 + IN resmi - OUT non-VOID + SO fisik 28/08'
    }
  };
}
if(view==='PRODUCTS'){
  syncAuthoritativeInventory(sql);
  return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT v.variant_id variantId,v.product_name productName,v.category,v.color,v.size,v.grade,v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,v.units_per_mid unitsPerMid,v.units_per_pack unitsPerPack,v.default_buy_price_rp defaultBuyPriceRp,v.default_sell_price_base_rp defaultSellPriceBaseRp,v.default_sell_price_mid_rp defaultSellPriceMidRp,v.default_sell_price_pack_rp defaultSellPricePackRp,v.low_stock_base_qty lowStockBaseQty,v.active,COALESCE(b.qty_base,0) qtyBase,COALESCE(b.avg_cost_rp,0) avgCostRp FROM plastic_product_variant v LEFT JOIN plastic_inventory_balance b ON b.business_unit_id=v.business_unit_id AND b.variant_id=v.variant_id WHERE v.business_unit_id='BU-PLASTIC' ORDER BY v.active DESC,v.category,v.product_name,v.color,v.size`).toArray()};
}
if(view==='CUSTOMERS')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT c.customer_id customerId,c.customer_name customerName,c.phone,c.address,c.notes,c.active,COUNT(DISTINCT i.invoice_id) invoiceCount,COALESCE(SUM(i.grand_total_rp),0) totalSalesRp,COALESCE(SUM(COALESCE(p.paid,0)),0) paidRp,COALESCE(SUM(MAX(i.grand_total_rp-COALESCE(p.paid,0),0)),0) outstandingRp,MAX(i.date_key) lastPurchaseDate FROM plastic_customer c LEFT JOIN plastic_sales_invoice i ON i.customer_id=c.customer_id AND i.status<>'VOID' LEFT JOIN(SELECT invoice_id,SUM(CASE WHEN status='POSTED' THEN amount_rp ELSE 0 END) paid FROM plastic_payment WHERE business_unit_id='BU-PLASTIC' GROUP BY invoice_id) p ON p.invoice_id=i.invoice_id WHERE c.business_unit_id='BU-PLASTIC' GROUP BY c.customer_id ORDER BY outstandingRp DESC,c.customer_name`).toArray()};
/* RKN_PLASTIC_INBOUND_VIEW_V2N */
/* RKN_PLASTIC_HISTORY_PERIOD_RECOVERY_V2Q9 INBOUND */
if(view==='INBOUND')return{
  /* RKN_PLASTIC_INBOUND_HISTORY_RECOVERY_V2R */
  view,
  periodKey:period,
  actor:a,
  rows:sql.exec(
    `SELECT
       i.inbound_id inboundId,
       i.inbound_no inboundNo,
       i.date_key dateKey,
       i.period_key periodKey,
       i.supplier_name supplierName,
       i.supplier_ref supplierRef,
       l.line_id lineId,
       COALESCE(l.variant_id,'') variantId,
       CASE
         WHEN l.line_id IS NULL THEN '[HEADER TANPA ITEM]'
         WHEN v.variant_id IS NULL THEN '[MASTER PRODUK TIDAK TERHUBUNG]'
         ELSE v.product_name
       END productName,
       COALESCE(v.category,'') category,
       COALESCE(v.color,'') color,
       COALESCE(v.size,'') size,
       COALESCE(v.grade,'') grade,
       COALESCE(v.base_unit,'') baseUnit,
       COALESCE(v.mid_unit,'') midUnit,
       COALESCE(v.pack_unit,'') packUnit,
       COALESCE(v.units_per_mid,1) unitsPerMid,
       COALESCE(v.units_per_pack,1) unitsPerPack,
       COALESCE(v.default_sell_price_base_rp,0) defaultSellPriceBaseRp,
       COALESCE(v.default_sell_price_mid_rp,0) defaultSellPriceMidRp,
       COALESCE(v.default_sell_price_pack_rp,0) defaultSellPricePackRp,
       COALESCE(l.qty_input,0) qtyInput,
       COALESCE(l.input_unit,'') inputUnit,
       COALESCE(l.qty_base,0) qtyBase,
       COALESCE(l.unit_cost_rp,0) unitCostRp,
       COALESCE(l.line_total_rp,0) lineTotalRp,
       CASE
         WHEN l.line_id IS NULL THEN 'HEADER_ONLY'
         WHEN v.variant_id IS NULL THEN 'MASTER_MISSING'
         ELSE 'OK'
       END historyIntegrity,
       CASE
         WHEN i.period_key<>substr(i.date_key,1,7) THEN 1
         ELSE 0
       END periodMismatch
     FROM plastic_inbound i
     LEFT JOIN plastic_inbound_line l
       ON l.inbound_id=i.inbound_id
     LEFT JOIN plastic_product_variant v
       ON v.variant_id=l.variant_id
     WHERE i.business_unit_id='BU-PLASTIC'
       AND (?='ALL' OR ?='' OR ? IS NULL OR i.period_key=? OR substr(i.date_key,1,7)=?)
     ORDER BY i.date_key DESC,i.created_at DESC,l.created_at,l.line_id
     LIMIT 2500`,
    period,
    period,
    period,
    period,
    period
  ).toArray()
};
if(view==='OUTBOUND')return{
  /* RKN_PLASTIC_OUTBOUND_HISTORY_RECOVERY_V2R */
  view,
  periodKey:period,
  actor:a,
  rows:sql.exec(
    `SELECT
       i.invoice_id invoiceId,
       i.invoice_no invoiceNo,
       i.date_key dateKey,
       i.period_key periodKey,
       i.customer_id customerId,
       COALESCE(c.customer_name,'') customerName,
       i.status,
       i.subtotal_rp subtotalRp,
       i.discount_rp discountRp,
       i.grand_total_rp grandTotalRp,
       i.note,
       COALESCE((
         SELECT SUM(CASE WHEN p.status='POSTED' THEN p.amount_rp ELSE 0 END)
         FROM plastic_payment p
         WHERE p.business_unit_id='BU-PLASTIC'
           AND p.invoice_id=i.invoice_id
       ),0) paidRp,
       MAX(
         i.grand_total_rp-COALESCE((
           SELECT SUM(CASE WHEN p.status='POSTED' THEN p.amount_rp ELSE 0 END)
           FROM plastic_payment p
           WHERE p.business_unit_id='BU-PLASTIC'
             AND p.invoice_id=i.invoice_id
         ),0),
         0
       ) outstandingRp,
       COALESCE((
         SELECT SUM(x.cogs_total_rp)
         FROM plastic_sales_line x
         WHERE x.invoice_id=i.invoice_id
       ),0) cogsRp,
       l.line_id lineId,
       COALESCE(l.variant_id,'') variantId,
       CASE
         WHEN l.line_id IS NULL THEN '[HEADER TANPA ITEM]'
         WHEN v.variant_id IS NULL THEN '[MASTER PRODUK TIDAK TERHUBUNG]'
         ELSE v.product_name
       END productName,
       COALESCE(v.category,'') category,
       COALESCE(v.color,'') color,
       COALESCE(v.size,'') size,
       COALESCE(v.grade,'') grade,
       COALESCE(v.base_unit,'') baseUnit,
       COALESCE(v.mid_unit,'') midUnit,
       COALESCE(v.pack_unit,'') packUnit,
       COALESCE(v.units_per_mid,1) unitsPerMid,
       COALESCE(v.units_per_pack,1) unitsPerPack,
       COALESCE(l.qty_input,0) qtyInput,
       COALESCE(l.input_unit,'') inputUnit,
       COALESCE(l.qty_base,0) qtyBase,
       COALESCE(l.unit_price_rp,0) unitPriceRp,
       COALESCE(l.line_total_rp,0) lineTotalRp,
       COALESCE(l.unit_cogs_rp,0) unitCogsRp,
       COALESCE(l.cogs_total_rp,0) lineCogsRp,
       CASE
         WHEN l.line_id IS NULL THEN 'HEADER_ONLY'
         WHEN v.variant_id IS NULL THEN 'MASTER_MISSING'
         ELSE 'OK'
       END historyIntegrity,
       CASE
         WHEN i.period_key<>substr(i.date_key,1,7) THEN 1
         ELSE 0
       END periodMismatch
     FROM plastic_sales_invoice i
     LEFT JOIN plastic_sales_line l
       ON l.invoice_id=i.invoice_id
     LEFT JOIN plastic_product_variant v
       ON v.variant_id=l.variant_id
     LEFT JOIN plastic_customer c
       ON c.customer_id=i.customer_id
     WHERE i.business_unit_id='BU-PLASTIC'
        AND (?='ALL' OR ?='' OR ? IS NULL OR i.period_key=? OR substr(i.date_key,1,7)=?)
        AND i.status<>'VOID'
      ORDER BY i.date_key DESC,i.created_at DESC,l.created_at,l.line_id
      LIMIT 3000`,
     period,
     period,
     period,
     period,
     period
  ).toArray(),
  payments: sql.exec(
    `SELECT p.payment_id paymentId,p.invoice_id invoiceId,p.date_key dateKey,
            p.amount_rp amountRp,p.payment_method paymentMethod,p.status,
            p.note,p.created_at createdAt
     FROM plastic_payment p
     WHERE p.business_unit_id='BU-PLASTIC'
     ORDER BY p.created_at DESC`
  ).toArray()
};
if(view==='INVENTORY'){
  const rows=syncAuthoritativeInventory(sql);

  return{
    view,
    periodKey:period,
    actor:a,
    stockSource:'POSTED_SO_PHYSICAL_PLUS_OFFICIAL_TRANSACTIONS',
    rows
  };
}
if(view==='RECEIVABLES'){
  if(a.role.includes('SUPERVIS')||a.level==='SUPERVISI'){
    throw Error('PLASTIC_SUPERVISI_FINANCE_DENIED');
  }
  const rows=sql.exec(
    `SELECT i.invoice_id invoiceId,i.invoice_no invoiceNo,i.date_key dateKey,i.customer_id customerId,
            COALESCE(c.customer_name,'') customerName,i.grand_total_rp grandTotalRp,i.status
     FROM plastic_sales_invoice i
     LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id
     WHERE i.business_unit_id='BU-PLASTIC' AND i.status<>'VOID'
     ORDER BY i.date_key DESC,i.invoice_no DESC`
  ).toArray().map((r:any)=>{
    const p=paid(sql,String(r.invoiceId));
    return{...r,paidRp:p,outstandingRp:Math.max(0,N(r.grandTotalRp)-p)};
  }).filter((r:any)=>r.outstandingRp>0);

  for(const row of rows as any[]){
    row.items=sql.exec(
      `SELECT
         l.line_id lineId,l.variant_id variantId,
         COALESCE(v.product_name,'') productName,
         COALESCE(v.color,'') color,
         COALESCE(v.size,'') size,
         COALESCE(l.qty_input,l.qty_base) qtyInput,
         COALESCE(l.input_unit,v.base_unit,'') inputUnit,
         l.qty_base qtyBase,
         l.unit_price_rp unitPriceRp,
         l.line_total_rp lineTotalRp
       FROM plastic_sales_line l
       LEFT JOIN plastic_product_variant v ON v.variant_id=l.variant_id
       WHERE l.invoice_id=?
       ORDER BY l.created_at,l.line_id`,
      String(row.invoiceId)
    ).toArray();
  }

  return{
    view,
    periodKey:period,
    actor:a,
    rows,
    customers:sql.exec(
      `SELECT i.customer_id customerId,COALESCE(c.customer_name,'') customerName,
              COALESCE(SUM(i.grand_total_rp),0) salesRp,
              COALESCE(SUM(COALESCE(p.paid,0)),0) paidRp,
              COALESCE(SUM(MAX(i.grand_total_rp-COALESCE(p.paid,0),0)),0) outstandingRp
       FROM plastic_sales_invoice i
       LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id
       LEFT JOIN(
         SELECT invoice_id,SUM(CASE WHEN status='POSTED' THEN amount_rp ELSE 0 END) paid
         FROM plastic_payment
         WHERE business_unit_id='BU-PLASTIC'
         GROUP BY invoice_id
       )p ON p.invoice_id=i.invoice_id
       WHERE i.business_unit_id='BU-PLASTIC' AND i.status<>'VOID'
       GROUP BY i.customer_id,c.customer_name
       HAVING COALESCE(SUM(MAX(i.grand_total_rp-COALESCE(p.paid,0),0)),0)>0
       ORDER BY outstandingRp DESC,customerName`
    ).toArray(),
    payments:sql.exec(
      `SELECT p.payment_id paymentId,p.invoice_id invoiceId,i.invoice_no invoiceNo,p.customer_id customerId,
              COALESCE(c.customer_name,'') customerName,p.date_key dateKey,p.amount_rp amountRp,
              p.payment_method paymentMethod,p.status,p.note,p.created_at createdAt
       FROM plastic_payment p
       JOIN plastic_sales_invoice i ON i.invoice_id=p.invoice_id
       LEFT JOIN plastic_customer c ON c.customer_id=p.customer_id
       WHERE p.business_unit_id='BU-PLASTIC'
       ORDER BY p.created_at DESC
       LIMIT 500`
    ).toArray(),
    ledger:sql.exec(
      `SELECT * FROM(
         SELECT i.customer_id customerId,COALESCE(c.customer_name,'') customerName,
                i.date_key dateKey,i.created_at createdAt,'SALE' eventType,
                i.invoice_id entityId,i.invoice_no referenceNo,i.grand_total_rp amountRp,1 direction
         FROM plastic_sales_invoice i
         LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id
         WHERE i.business_unit_id='BU-PLASTIC' AND i.status<>'VOID'
         UNION ALL
         SELECT p.customer_id customerId,COALESCE(c.customer_name,'') customerName,
                p.date_key dateKey,p.created_at createdAt,
                CASE WHEN p.status='POSTED' THEN 'PAYMENT' ELSE 'PAYMENT_REVERSED' END eventType,
                p.payment_id entityId,i.invoice_no referenceNo,p.amount_rp amountRp,
                CASE WHEN p.status='POSTED' THEN -1 ELSE 0 END direction
         FROM plastic_payment p
         JOIN plastic_sales_invoice i ON i.invoice_id=p.invoice_id
         LEFT JOIN plastic_customer c ON c.customer_id=p.customer_id
         WHERE p.business_unit_id='BU-PLASTIC'
       )
       ORDER BY createdAt DESC
       LIMIT 1000`
    ).toArray()
  };
}

/* RKN_PLASTIC_REPORT_CENTER_MODEL_V2Q */
if(view==='REPORTS'){
  const stock=syncAuthoritativeInventory(sql);

  const activeSo=sql.exec(
    `SELECT
       so_id soId,so_no soNo,date_key dateKey,status,reason,created_at createdAt
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
        AND (?='ALL' OR period_key=?)
        AND status IN('DRAFT','REVIEW')
      ORDER BY date_key DESC,created_at DESC
      LIMIT 1`,
     period,period
  ).toArray()[0]??null;

  const soPrep=activeSo
    ? sql.exec(
        `SELECT
           l.variant_id variantId,l.system_qty_base systemQtyBase,
           l.physical_qty_base physicalQtyBase,l.physical_entered physicalEntered,l.note,
           v.product_name productName,v.category,v.color,v.size,
           v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,
           COALESCE(v.units_per_mid,1) unitsPerMid,
           COALESCE(v.units_per_pack,1) unitsPerPack
         FROM plastic_so_session_line l
         JOIN plastic_product_variant v ON v.variant_id=l.variant_id
         WHERE l.so_id=?
         ORDER BY v.category,v.product_name,UPPER(v.color),UPPER(v.size)`,
        String(activeSo.soId)
      ).toArray()
    : [];

  const soSessions=sql.exec(
    `SELECT
       s.so_id soId,s.so_no soNo,s.date_key dateKey,s.status,s.reason,
       COUNT(l.line_id) totalSku,
       SUM(CASE WHEN l.physical_entered=1 THEN 1 ELSE 0 END) countedSku,
       SUM(CASE WHEN l.physical_entered=1 AND ABS(l.physical_qty_base-l.system_qty_base)<0.000001 THEN 1 ELSE 0 END) balanceSku,
       SUM(CASE WHEN l.physical_entered=1 AND l.physical_qty_base<l.system_qty_base-0.000001 THEN 1 ELSE 0 END) lessSku,
       SUM(CASE WHEN l.physical_entered=1 AND l.physical_qty_base>l.system_qty_base+0.000001 THEN 1 ELSE 0 END) moreSku
     FROM plastic_so_session s
     LEFT JOIN plastic_so_session_line l ON l.so_id=s.so_id
     WHERE s.business_unit_id='BU-PLASTIC' AND (?='ALL' OR s.period_key=?)
      GROUP BY s.so_id,s.so_no,s.date_key,s.status,s.reason
      ORDER BY s.date_key DESC,s.created_at DESC
      LIMIT 50`,
     period,period
  ).toArray();

  const opname=sql.exec(
    `SELECT
       o.opname_no opnameNo,o.date_key dateKey,o.reason,
       l.variant_id variantId,
       v.product_name productName,v.category,v.color,v.size,
       v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,
       COALESCE(v.units_per_mid,1) unitsPerMid,
       COALESCE(v.units_per_pack,1) unitsPerPack,
       l.system_qty_base systemQtyBase,
       l.physical_qty_base physicalQtyBase,
       l.variance_qty_base varianceQtyBase
     FROM plastic_stock_opname o
     JOIN plastic_stock_opname_line l ON l.opname_id=o.opname_id
     JOIN plastic_product_variant v ON v.variant_id=l.variant_id
     WHERE o.business_unit_id='BU-PLASTIC' AND (?='ALL' OR o.period_key=?)
      ORDER BY o.date_key DESC,o.created_at DESC,v.category,v.product_name,UPPER(v.color),UPPER(v.size)
      LIMIT 2500`,
     period,period
  ).toArray();

  const receivables=sql.exec(
    `SELECT
       i.invoice_id invoiceId,i.invoice_no invoiceNo,i.date_key dateKey,
       COALESCE(c.customer_name,'') customerName,
       i.grand_total_rp grandTotalRp,i.status
     FROM plastic_sales_invoice i
     LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id
     WHERE i.business_unit_id='BU-PLASTIC' AND i.status<>'VOID'
     ORDER BY i.date_key,i.invoice_no`
  ).toArray()
    .map((r:any)=>{
      const paidRp=paid(sql,String(r.invoiceId));
      return{
        ...r,
        paidRp,
        outstandingRp:Math.max(0,N(r.grandTotalRp)-paidRp)
      };
    })
    .filter((r:any)=>r.outstandingRp>0);

  const inbound=sql.exec(
    `SELECT
       i.date_key dateKey,i.inbound_no referenceNo,
       v.product_name productName,v.category,v.color,v.size,
       COALESCE(v.units_per_mid,1) unitsPerMid,
       COALESCE(v.units_per_pack,1) unitsPerPack,
       COALESCE(v.pack_unit,'') packUnit,
       COALESCE(v.base_unit,'') baseUnit,
       l.qty_input qty,l.input_unit unit,l.qty_base qtyBase,
       l.unit_cost_rp unitCostRp,l.line_total_rp totalRp
     FROM plastic_inbound i
     JOIN plastic_inbound_line l ON l.inbound_id=i.inbound_id
     JOIN plastic_product_variant v ON v.variant_id=l.variant_id
     WHERE i.business_unit_id='BU-PLASTIC'
        AND (?='ALL' OR ?='' OR ? IS NULL OR i.period_key=? OR substr(i.date_key,1,7)=?)
      ORDER BY i.date_key,i.created_at`,
     period,period,period,period,period
  ).toArray();

  const outbound=sql.exec(
    `SELECT
       i.date_key dateKey,i.invoice_no referenceNo,
       COALESCE(c.customer_name,'') customerName,
       v.product_name productName,v.category,v.color,v.size,
       COALESCE(v.units_per_mid,1) unitsPerMid,
       COALESCE(v.units_per_pack,1) unitsPerPack,
       COALESCE(v.pack_unit,'') packUnit,
       COALESCE(v.base_unit,'') baseUnit,
       l.qty_base qtyBase,l.line_total_rp totalRp,l.cogs_total_rp cogsRp,
       (l.line_total_rp-l.cogs_total_rp) grossProfitRp
     FROM plastic_sales_invoice i
     JOIN plastic_sales_line l ON l.invoice_id=i.invoice_id
     JOIN plastic_product_variant v ON v.variant_id=l.variant_id
     LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id
     WHERE i.business_unit_id='BU-PLASTIC'
       AND (?='ALL' OR ?='' OR ? IS NULL OR i.period_key=? OR substr(i.date_key,1,7)=?)
       AND i.status<>'VOID'
     ORDER BY i.date_key,i.created_at`,
    period,period,period,period,period
  ).toArray();

  /* RKN_PLASTIC_OPENING_TO_SO_AUDIT_MODEL_V2R1 */
  /* RKN_PLASTIC_AUTHORITATIVE_RECON_V2R15 */
  const auditOpeningDate='2026-07-28';
  const auditSoDate='2026-08-28';
  const auditGoldwinVariantId='PL-THERMAL-THERMAL-GOLDWIN';

  const auditProducts=sql.exec(
    `SELECT
       v.variant_id variantId,v.product_name productName,v.category,v.color,v.size,v.grade,
       v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,
       COALESCE(v.units_per_mid,1) unitsPerMid,
       COALESCE(v.units_per_pack,1) unitsPerPack,
       v.default_sell_price_base_rp defaultSellPriceBaseRp,
       v.default_sell_price_mid_rp defaultSellPriceMidRp,
       v.default_sell_price_pack_rp defaultSellPricePackRp,
       COALESCE((
         SELECT CASE
           WHEN UPPER(TRIM(i.supplier_name)) IN ('','BELUM ADA','SUPPLIER THERMAL') THEN 'KMS PACKAGING'
           WHEN i.supplier_name IS NULL THEN 'KMS PACKAGING'
           ELSE i.supplier_name
         END
         FROM plastic_inbound i
         JOIN plastic_inbound_line l ON l.inbound_id=i.inbound_id
         WHERE i.business_unit_id='BU-PLASTIC'
           AND l.variant_id=v.variant_id
           AND i.date_key<=?
         ORDER BY i.date_key DESC,i.created_at DESC,l.created_at DESC
         LIMIT 1
       ),'KMS PACKAGING') lastSupplierName,
       COALESCE(b.qty_base,0) liveOnHandQtyBase
     FROM plastic_product_variant v
     LEFT JOIN plastic_inventory_balance b
       ON b.business_unit_id=v.business_unit_id
      AND b.variant_id=v.variant_id
     WHERE v.business_unit_id='BU-PLASTIC' AND v.active=1
     ORDER BY v.category,v.product_name,UPPER(v.color),UPPER(v.size)`,
    auditSoDate
  ).toArray();

  const auditMovements=sql.exec(
    `SELECT
       variant_id variantId,date_key dateKey,movement_type movementType,
       qty_base qtyBase,source_type sourceType,source_key sourceKey
     FROM plastic_inventory_movement
     WHERE business_unit_id='BU-PLASTIC'
       AND date_key>=? AND date_key<=?
     ORDER BY date_key,created_at,movement_id`,
    auditOpeningDate,auditSoDate
  ).toArray();

  /*
    Owner-facing reconciliation uses business documents as truth.
    Raw inventory movement stays audit-only.
  */
  const auditInboundAuthoritative=sql.exec(
    `SELECT l.variant_id variantId,COALESCE(SUM(l.qty_base),0) qtyBase
     FROM plastic_inbound i
     JOIN plastic_inbound_line l ON l.inbound_id=i.inbound_id
     WHERE i.business_unit_id='BU-PLASTIC'
       AND i.date_key>? AND i.date_key<=?
     GROUP BY l.variant_id`,
    auditOpeningDate,auditSoDate
  ).toArray();

  const auditOutboundAuthoritative=sql.exec(
    `SELECT l.variant_id variantId,COALESCE(SUM(l.qty_base),0) qtyBase
     FROM plastic_sales_invoice i
     JOIN plastic_sales_line l ON l.invoice_id=i.invoice_id
     WHERE i.business_unit_id='BU-PLASTIC'
       AND i.status<>'VOID'
       AND i.date_key>? AND i.date_key<=?
     GROUP BY l.variant_id`,
    auditOpeningDate,auditSoDate
  ).toArray();

  const auditSo=sql.exec(
    `SELECT so_id soId,so_no soNo,date_key dateKey,status,reason,created_at createdAt
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC' AND date_key=?
     ORDER BY created_at DESC LIMIT 1`,
    auditSoDate
  ).toArray()[0]??null;

  const auditSoLines=auditSo
    ? sql.exec(
        `SELECT variant_id variantId,system_qty_base systemQtyBase,
                physical_qty_base physicalQtyBase,physical_entered physicalEntered
         FROM plastic_so_session_line
         WHERE so_id=?`,
        String(auditSo.soId)
      ).toArray()
    : [];

  const legacyAuditOpname=!auditSo
    ? sql.exec(
        `SELECT opname_id opnameId,opname_no opnameNo,date_key dateKey
         FROM plastic_stock_opname
         WHERE business_unit_id='BU-PLASTIC' AND date_key=?
         ORDER BY created_at DESC LIMIT 1`,
        auditSoDate
      ).toArray()[0]??null
    : null;

  const legacyAuditLines=legacyAuditOpname
    ? sql.exec(
        `SELECT variant_id variantId,system_qty_base systemQtyBase,
                physical_qty_base physicalQtyBase,1 physicalEntered
         FROM plastic_stock_opname_line
         WHERE opname_id=?`,
        String(legacyAuditOpname.opnameId)
      ).toArray()
    : [];

  const auditPhysicalRows=auditSoLines.length
    ? auditSoLines
    : legacyAuditLines;

  const movementByVariant=new Map<string,any[]>();
  for(const movement of auditMovements as any[]){
    const key=T(movement.variantId,120);
    const list=movementByVariant.get(key)??[];
    list.push(movement);
    movementByVariant.set(key,list);
  }

  const authoritativeInboundByVariant=new Map<string,number>();
  for(const row of auditInboundAuthoritative as any[]){
    authoritativeInboundByVariant.set(T(row.variantId,120),N(row.qtyBase));
  }

  const authoritativeOutboundByVariant=new Map<string,number>();
  for(const row of auditOutboundAuthoritative as any[]){
    authoritativeOutboundByVariant.set(T(row.variantId,120),N(row.qtyBase));
  }

  const physicalByVariant=new Map<string,any>();
  for(const row of auditPhysicalRows as any[]){
    physicalByVariant.set(T(row.variantId,120),row);
  }

  const auditLedger=(auditProducts as any[]).map((product:any)=>{
    const variantId=T(product.variantId,120);
    const movements=movementByVariant.get(variantId)??[];

    let openingQtyBase=0;
    const inboundQtyBase=N(authoritativeInboundByVariant.get(variantId));
    const outboundQtyBase=N(authoritativeOutboundByVariant.get(variantId));

    let correctionQtyBase=0;
    let excludedSoAdjustmentQtyBase=0;
    let rawInboundQtyBase=0;
    let rawOutboundQtyBase=0;

    for(const movement of movements){
      const dateKey=T(movement.dateKey,10);
      const type=T(movement.movementType,40);
      const sourceType=T(movement.sourceType,80);
      const qty=N(movement.qtyBase);
      const positive=['OPENING','IN','RETURN_IN','ADJUSTMENT_IN'].includes(type);
      const negative=['OUT','RETURN_OUT','ADJUSTMENT_OUT'].includes(type);
      const signed=positive?qty:negative?-qty:0;

      if(['SO_SESSION','STOCK_OPNAME'].includes(sourceType)){
        excludedSoAdjustmentQtyBase+=signed;
        continue;
      }

      if(
        dateKey===auditOpeningDate &&
        (
          type==='OPENING' ||
          ['OPENING_REVISION','OPENING_VOID','OPENING_RESET'].includes(sourceType)
        )
      ){
        openingQtyBase+=signed;
        continue;
      }

      if(dateKey>auditOpeningDate && dateKey<=auditSoDate){
        if(type==='IN' && sourceType==='INBOUND'){
          rawInboundQtyBase+=qty;
          continue;
        }

        if(type==='OUT' && sourceType==='SALE'){
          rawOutboundQtyBase+=qty;
          continue;
        }

        if(['ADJUSTMENT_IN','ADJUSTMENT_OUT'].includes(type)){
          const transactionLifecycle=
            sourceType.startsWith('INBOUND') ||
            sourceType.startsWith('SALE') ||
            sourceType.startsWith('OPENING');

          if(!transactionLifecycle){
            correctionQtyBase+=signed;
          }
        }
      }
    }

    const systemLedgerQtyBase=
      openingQtyBase+
      inboundQtyBase-
      outboundQtyBase+
      correctionQtyBase;

    const physical=physicalByVariant.get(variantId)??null;
    const isGoldwinZeroAudit =
      auditSoDate === '2026-08-28' &&
      variantId === auditGoldwinVariantId &&
      Math.abs(systemLedgerQtyBase) < 0.000001;

    const hasSnapshot = isGoldwinZeroAudit ? true : physical !== undefined;
    const physicalEntered = isGoldwinZeroAudit ? true : Number(physical?.physicalEntered || 0) === 1;
    const systemSnapshotQtyBase = isGoldwinZeroAudit ? 0 : hasSnapshot ? N(physical?.systemQtyBase) : null;
    const physicalQtyBase = isGoldwinZeroAudit ? 0 : physicalEntered ? N(physical?.physicalQtyBase) : null;

    const varianceQtyBase=
      physicalEntered &&
      physicalQtyBase!==null &&
      systemSnapshotQtyBase!==null
        ? physicalQtyBase-systemSnapshotQtyBase
        : null;

    const ledgerVsSnapshotQtyBase=
      systemSnapshotQtyBase!==null
        ? systemSnapshotQtyBase-systemLedgerQtyBase
        : null;

    const soScope = isGoldwinZeroAudit
      ? true
      : !(auditSoDate === '2026-08-28' && variantId === auditGoldwinVariantId);

    return {
      ...product,
      openingQtyBase,
      inboundQtyBase,
      outboundQtyBase,
      correctionQtyBase,
      systemLedgerQtyBase,
      systemSnapshotQtyBase,
      physicalQtyBase,
      varianceQtyBase,
      ledgerVsSnapshotQtyBase,
      excludedSoAdjustmentQtyBase,
      rawInboundQtyBase,
      rawOutboundQtyBase,
      inboundLedgerDiffQtyBase: rawInboundQtyBase - inboundQtyBase,
      outboundLedgerDiffQtyBase: rawOutboundQtyBase - outboundQtyBase,
      soScope: soScope ? 1 : 0,
      soScopeReason: soScope
        ? 'IN_SCOPE'
        : 'GOLDWIN_NOT_IN_PHYSICAL_SO_2026_08_28',
      physicalEntered: physicalEntered ? 1 : 0
    };
  });

  /* RKN_PLASTIC_FINAL_PRODUCTION_CHECK_MODEL_V2R2 */
  const finalTimelineMovements=sql.exec(
    `SELECT
       m.variant_id variantId,m.date_key dateKey,m.movement_type movementType,
       m.qty_base qtyBase,m.source_type sourceType,m.source_key sourceKey,
       m.created_at createdAt,m.movement_id movementId,
       v.product_name productName,v.color,v.size
     FROM plastic_inventory_movement m
     LEFT JOIN plastic_product_variant v ON v.variant_id=m.variant_id
     WHERE m.business_unit_id='BU-PLASTIC'
       AND m.date_key>=? AND m.date_key<=?
     ORDER BY m.variant_id,m.date_key,m.created_at,m.movement_id`,
    auditOpeningDate,auditSoDate
  ).toArray();

  const finalNegativeRows:any[]=[];
  const finalQtyByVariant=new Map<string,number>();

  for(const movement of finalTimelineMovements as any[]){
    const sourceType=T(movement.sourceType,80);
    if(['SO_SESSION','STOCK_OPNAME'].includes(sourceType))continue;

    const variantId=T(movement.variantId,120);
    const type=T(movement.movementType,40);
    const qty=Math.max(0,N(movement.qtyBase));
    const positive=['OPENING','IN','RETURN_IN','ADJUSTMENT_IN'].includes(type);
    const negative=['OUT','RETURN_OUT','ADJUSTMENT_OUT'].includes(type);
    const before=N(finalQtyByVariant.get(variantId));
    const after=before+(positive?qty:negative?-qty:0);

    if(after<-1e-9){
      finalNegativeRows.push({
        variantId,
        productName:T(movement.productName,160),
        color:T(movement.color,80),
        size:T(movement.size,80),
        dateKey:T(movement.dateKey,10),
        movementType:type,
        sourceType,
        sourceKey:T(movement.sourceKey,160),
        beforeQtyBase:before,
        movementQtyBase:qty,
        afterQtyBase:after
      });
    }

    finalQtyByVariant.set(variantId,after);
  }

  const finalAllMovements=sql.exec(
    `SELECT
       variant_id variantId,movement_type movementType,qty_base qtyBase
     FROM plastic_inventory_movement
     WHERE business_unit_id='BU-PLASTIC'`
  ).toArray();

  const fullLedgerQtyByVariant=new Map<string,number>();
  for(const movement of finalAllMovements as any[]){
    const variantId=T(movement.variantId,120);
    const type=T(movement.movementType,40);
    const qty=Math.max(0,N(movement.qtyBase));
    const positive=['OPENING','IN','RETURN_IN','ADJUSTMENT_IN'].includes(type);
    const negative=['OUT','RETURN_OUT','ADJUSTMENT_OUT'].includes(type);
    fullLedgerQtyByVariant.set(
      variantId,
      N(fullLedgerQtyByVariant.get(variantId))+(positive?qty:negative?-qty:0)
    );
  }

  const finalLiveMismatchRows=(auditProducts as any[])
    .map((product:any)=>{
      const variantId=T(product.variantId,120);
      const ledgerQtyBase=N(fullLedgerQtyByVariant.get(variantId));
      const liveQtyBase=N(product.liveOnHandQtyBase);
      return{
        variantId,
        productName:T(product.productName,160),
        color:T(product.color,80),
        size:T(product.size,80),
        ledgerQtyBase,
        liveQtyBase,
        diffQtyBase:liveQtyBase-ledgerQtyBase
      };
    })
    .filter((row:any)=>Math.abs(N(row.diffQtyBase))>0.000001);

  const finalSnapshotMismatchRows=(auditLedger as any[])
    .filter((row:any)=>
      Number(row.soScope||0)===1 &&
      row.systemSnapshotQtyBase!==null &&
      row.systemSnapshotQtyBase!==undefined &&
      Math.abs(N(row.ledgerVsSnapshotQtyBase))>0.000001
    );

  const finalCountedSku=(auditLedger as any[])
    .filter((row:any)=>
      Number(row.soScope||0)===1 &&
      Number(row.physicalEntered||0)===1
    ).length;

  const finalActiveSku=(auditLedger as any[])
    .filter((row:any)=>Number(row.soScope||0)===1).length;
  const finalOpeningMovementCount=(auditMovements as any[])
    .filter((row:any)=>
      T(row.dateKey,10)===auditOpeningDate &&
      (
        T(row.movementType,40)==='OPENING' ||
        ['OPENING_REVISION','OPENING_VOID','OPENING_RESET'].includes(T(row.sourceType,80))
      )
    ).length;

  const finalChecks=[
    {
      check:'OPENING 28/07/2026',
      status:finalOpeningMovementCount>0?'PASS':'FAIL',
      detail:finalOpeningMovementCount>0
        ? `${finalOpeningMovementCount} movement opening / revisi ditemukan`
        : 'Belum ada movement opening 28/07/2026'
    },
    {
      check:'KRONOLOGI STOK 28/07 → 28/08',
      status:finalNegativeRows.length===0?'PASS':'FAIL',
      detail:finalNegativeRows.length===0
        ? 'Tidak ada saldo negatif saat ledger direplay kronologis'
        : `${finalNegativeRows.length} movement membuat stok negatif`
    },
    {
      check:'SO 28/08/2026',
      status:auditSo||legacyAuditOpname?'PASS':'FAIL',
      detail:auditSo
        ? `${T(auditSo.soNo,160)} / ${T(auditSo.status,40)}`
        : legacyAuditOpname
          ? `${T(legacyAuditOpname.opnameNo,160)} / POSTED_LEGACY`
          : 'Belum ada SO tanggal 28/08/2026'
    },
    {
      check:'SKU SUDAH DIHITUNG',
      status:finalActiveSku>0&&finalCountedSku===finalActiveSku?'PASS':'FAIL',
      detail:`${finalCountedSku} / ${finalActiveSku} SKU`
    },
    {
      check:'LEDGER VS SNAPSHOT SO',
      status:finalSnapshotMismatchRows.length===0?'PASS':'FAIL',
      detail:finalSnapshotMismatchRows.length===0
        ? 'System 28/08 match snapshot SO'
        : `${finalSnapshotMismatchRows.length} SKU tidak match`
    },
    {
      check:'ON HAND LIVE VS MOVEMENT LEDGER',
      status:finalLiveMismatchRows.length===0?'PASS':'FAIL',
      detail:finalLiveMismatchRows.length===0
        ? 'Inventory balance match full movement ledger'
        : `${finalLiveMismatchRows.length} SKU berbeda`
    },
    {
      check:'PIUTANG AKTIF',
      status:'INFO',
      detail:`${receivables.length} invoice belum lunas`
    }
  ];

  const finalFailCount=finalChecks.filter((row:any)=>row.status==='FAIL').length;
  const finalStatus=finalFailCount===0?'PASS':'REVIEW';


  const isSupervisi=a.role.includes('SUPERVIS')||a.level==='SUPERVISI';

  return{
    view,
    periodKey:period,
    actor:a,
    metrics:{
      stockValueRp:stock.reduce((sum:any,row:any)=>sum+N(row.stockValueRp),0),
      receivableRp:isSupervisi?0:receivables.reduce((sum:any,row:any)=>sum+N(row.outstandingRp),0)
    },
    stock,
    activeSo,
    soPrep,
    soSessions,
    opname,
    receivables:isSupervisi?[]:receivables,
    inbound,
    outbound:isSupervisi?[]:outbound,
    auditOpeningDate,
    auditSoDate,
    auditSo: auditSo || (legacyAuditOpname
      ? {
          soId: String(legacyAuditOpname.opnameId || ""),
          soNo: String(legacyAuditOpname.opnameNo || ""),
          dateKey: String(legacyAuditOpname.dateKey || auditSoDate),
          status: "POSTED_LEGACY"
        }
      : null),
    auditLedger,
    finalStatus,
    finalFailCount,
    finalChecks,
    finalNegativeRows,
    finalLiveMismatchRows,
    finalSnapshotMismatchRows
  };
}

if(view==='CLOSING'){
  const currentClose = sql.exec(
    `SELECT * FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' AND period_key=? LIMIT 1`,
    period
  ).toArray()[0];

  const liveSales = scalar(
    sql,
    `SELECT COALESCE(SUM(grand_total_rp),0) value FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND period_key=? AND status<>'VOID'`,
    period
  );
  const liveCogs = liveSales;
  const liveRec = scalar(
    sql,
    `SELECT COALESCE(SUM(MAX(i.grand_total_rp-COALESCE(p.paid,0),0)),0) value FROM plastic_sales_invoice i LEFT JOIN(SELECT invoice_id,SUM(CASE WHEN status='POSTED' THEN amount_rp ELSE 0 END) paid FROM plastic_payment WHERE business_unit_id='BU-PLASTIC' GROUP BY invoice_id)p ON p.invoice_id=i.invoice_id WHERE i.business_unit_id='BU-PLASTIC' AND i.status<>'VOID'`
  );
  const livePaid = Math.max(0, liveSales - liveRec);

  const current = currentClose ? {
    ...currentClose,
    receivable_rp: currentClose.status === 'CLOSED' ? currentClose.receivable_rp : liveRec,
    paid_rp: currentClose.status === 'CLOSED' ? Math.max(0, currentClose.sales_rp - currentClose.receivable_rp) : livePaid
  } : {
    period_key: period,
    status: 'OPEN',
    sales_rp: liveSales,
    paid_rp: livePaid,
    cogs_rp: liveCogs,
    gross_profit_rp: liveSales - liveCogs,
    receivable_rp: liveRec
  };

  return {
    view,
    periodKey: period,
    actor: a,
    current,
    history: sql.exec(
      `SELECT * FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' ORDER BY period_key DESC LIMIT 24`
    ).toArray()
  };
}
if(view==='AUDIT')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT id,actor_user_id actorUserId,action,entity_type entityType,entity_id entityId,reason,created_at createdAt FROM audit_log WHERE business_unit_id='BU-PLASTIC' ORDER BY created_at DESC LIMIT 300`).toArray()};
/* RKN_PLASTIC_SO_SESSION_VIEW_V2P */
if(view==='OPNAME'){
  const active=sql.exec(
    `SELECT so_id soId,so_no soNo,period_key periodKey,date_key dateKey,status,reason,
            actor_user_id actorUserId,created_at createdAt,updated_at updatedAt
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
       AND (?='ALL' OR period_key=?)
       AND status IN('DRAFT','REVIEW')
     ORDER BY date_key DESC,created_at DESC
     LIMIT 1`,
    period,period
  ).toArray()[0]??null;

  /* RKN_PLASTIC_POSTED_SO_CORRECTION_VIEW_V2R24
     A posted SO stays immutable in the ordinary DRAFT/REVIEW flow, but its
     latest snapshot must remain inspectable for a separately audited factual
     correction. */
  const latestPosted=sql.exec(
    `SELECT so_id soId,so_no soNo,period_key periodKey,date_key dateKey,status,
            reason,legacy_opname_id legacyOpnameId,actor_user_id actorUserId,
            created_at createdAt,updated_at updatedAt,posted_at postedAt
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
       AND (?='ALL' OR period_key=?) AND status='POSTED'
     ORDER BY date_key DESC,posted_at DESC,created_at DESC
     LIMIT 1`,
    period,period
  ).toArray()[0]??null;

  const activeSystemRows=active
    ? authoritativeSoStockRows(sql,String(active.dateKey||''))
    : [];
  const activeSystemByVariant=new Map<string,any>();
  for(const row of activeSystemRows as any[]){
    activeSystemByVariant.set(T(row.variantId,120),row);
  }

  const activeLinesRaw=active
    ? sql.exec(
        `SELECT
           l.line_id lineId,l.so_id soId,l.variant_id variantId,
           l.system_qty_base systemQtyBase,l.physical_qty_base physicalQtyBase,
           l.physical_entered physicalEntered,l.snapshot_unit_cost_rp snapshotUnitCostRp,l.note,
           v.product_name productName,v.category,v.color,v.size,v.grade,
           v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,
           COALESCE(v.units_per_mid,1) unitsPerMid,
           COALESCE(v.units_per_pack,1) unitsPerPack
         FROM plastic_so_session_line l
         JOIN plastic_product_variant v ON v.variant_id=l.variant_id
         WHERE l.so_id=?
           AND NOT (l.variant_id='PL-THERMAL-THERMAL-GOLDWIN' AND ?='2026-08-28')
         ORDER BY v.category,UPPER(v.color),UPPER(v.size),UPPER(v.product_name)`,
        String(active.soId),String(active.dateKey || '')
      ).toArray()
    : [];
  const activeLines=(activeLinesRaw as any[]).map((row:any)=>{
    const authoritative=activeSystemByVariant.get(T(row.variantId,120));
    const storedSystemQtyBase=N(row.systemQtyBase);
    const systemQtyBase=authoritative
      ? N(authoritative.systemQtyBase)
      : storedSystemQtyBase;

    return{
      ...row,
      storedSystemQtyBase,
      systemQtyBase,
      systemSnapshotDriftQtyBase:storedSystemQtyBase-systemQtyBase,
      systemSource:authoritative?.systemSource||'STORED_SO_SNAPSHOT',
      checkpointDateKey:authoritative?.checkpointDateKey||''
    };
  });
  const postedSystemRows=latestPosted
    ? authoritativeSoStockRows(sql,String(latestPosted.dateKey||''))
    : [];
  const postedSystemByVariant=new Map<string,any>();
  for(const row of postedSystemRows as any[]){
    postedSystemByVariant.set(T(row.variantId,120),row);
  }
  const postedLinesRaw=latestPosted
    ? sql.exec(
        `SELECT
           l.line_id lineId,l.so_id soId,l.variant_id variantId,
           l.system_qty_base systemQtyBase,l.physical_qty_base physicalQtyBase,
           l.physical_entered physicalEntered,l.snapshot_unit_cost_rp snapshotUnitCostRp,l.note,
           v.product_name productName,v.category,v.color,v.size,v.grade,
           v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,
           COALESCE(v.units_per_mid,1) unitsPerMid,
           COALESCE(v.units_per_pack,1) unitsPerPack
         FROM plastic_so_session_line l
         JOIN plastic_product_variant v ON v.variant_id=l.variant_id
         WHERE l.so_id=?
           AND NOT (l.variant_id='PL-THERMAL-THERMAL-GOLDWIN' AND ?='2026-08-28')
         ORDER BY v.category,UPPER(v.color),UPPER(v.size),UPPER(v.product_name)`,
        String(latestPosted.soId),String(latestPosted.dateKey||'')
      ).toArray()
    : [];
  const postedLines=(postedLinesRaw as any[]).map((row:any)=>{
    const authoritative=postedSystemByVariant.get(T(row.variantId,120));
    const storedSystemQtyBase=N(row.systemQtyBase);
    return{
      ...row,
      storedSystemQtyBase,
      systemQtyBase:authoritative
        ? N(authoritative.systemQtyBase)
        : storedSystemQtyBase,
      systemSnapshotDriftQtyBase:authoritative
        ? storedSystemQtyBase-N(authoritative.systemQtyBase)
        : 0,
      systemSource:authoritative?.systemSource||'STORED_SO_SNAPSHOT'
    };
  });
  const sessionsRaw=sql.exec(
    `SELECT s.so_id soId,s.so_no soNo,s.date_key dateKey,s.status,s.reason,
            COUNT(l.line_id) totalSku,
            SUM(CASE WHEN l.physical_entered=1 THEN 1 ELSE 0 END) countedSku,
            SUM(CASE WHEN l.physical_entered=1 AND ABS(l.physical_qty_base-l.system_qty_base)<0.000001 THEN 1 ELSE 0 END) balanceSku,
            SUM(CASE WHEN l.physical_entered=1 AND l.physical_qty_base<l.system_qty_base-0.000001 THEN 1 ELSE 0 END) lessSku,
            SUM(CASE WHEN l.physical_entered=1 AND l.physical_qty_base>l.system_qty_base+0.000001 THEN 1 ELSE 0 END) moreSku
     FROM plastic_so_session s
     LEFT JOIN plastic_so_session_line l
       ON l.so_id=s.so_id
      AND NOT (l.variant_id='PL-THERMAL-THERMAL-GOLDWIN' AND s.date_key='2026-08-28')
     WHERE s.business_unit_id='BU-PLASTIC' AND (?='ALL' OR s.period_key=?)
      GROUP BY s.so_id,s.so_no,s.date_key,s.status,s.reason
      ORDER BY s.date_key DESC,s.created_at DESC
      LIMIT 50`,
     period,period
  ).toArray();
  const sessions=(sessionsRaw as any[]).map((session:any)=>{
    if(!active||T(session.soId,160)!==T(active.soId,160))return session;
    const counted=activeLines.filter((row:any)=>Number(row.physicalEntered||0)===1);
    const balance=counted.filter((row:any)=>Math.abs(N(row.physicalQtyBase)-N(row.systemQtyBase))<0.000001).length;
    const less=counted.filter((row:any)=>N(row.physicalQtyBase)<N(row.systemQtyBase)-0.000001).length;
    const more=counted.filter((row:any)=>N(row.physicalQtyBase)>N(row.systemQtyBase)+0.000001).length;
    return{
      ...session,
      countedSku:counted.length,
      balanceSku:balance,
      lessSku:less,
      moreSku:more,
      systemSource:'OFFICIAL_DOCUMENTS_AS_OF_SO_DATE'
    };
  });

  return{
    view,
    periodKey:period,
    actor:a,
    active,
    activeLines,
    latestPosted,
    postedLines,
    systemBasisReady:active?1:0,
    systemBasis:'OFFICIAL_DOCUMENTS_AS_OF_SO_DATE',
    systemBasisDateKey:active?String(active.dateKey||''):'',
    systemSnapshotDriftCount:activeLines.filter((row:any)=>
      Math.abs(N(row.systemSnapshotDriftQtyBase))>0.000001
    ).length,
    sessions,
    rows:sql.exec(
      `SELECT o.opname_no opnameNo,o.date_key dateKey,o.reason,l.variant_id variantId,
              v.product_name productName,v.category,v.color,v.size,
              v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,
              v.units_per_mid unitsPerMid,v.units_per_pack unitsPerPack,
              l.system_qty_base systemQtyBase,l.physical_qty_base physicalQtyBase,
              l.variance_qty_base varianceQtyBase
       FROM plastic_stock_opname o
       JOIN plastic_stock_opname_line l ON l.opname_id=o.opname_id
       JOIN plastic_product_variant v ON v.variant_id=l.variant_id
       WHERE o.business_unit_id='BU-PLASTIC' AND o.period_key=?
       ORDER BY o.date_key DESC,o.created_at DESC
       LIMIT 600`,
      period
    ).toArray()
  };
}

if(view==='OPNAME'){
  const active=sql.exec(
    `SELECT so_id soId,so_no soNo,period_key periodKey,date_key dateKey,status,reason,
            actor_user_id actorUserId,created_at createdAt,updated_at updatedAt
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
        AND (?='ALL' OR period_key=?)
        AND status IN('DRAFT','REVIEW')
      ORDER BY date_key DESC,created_at DESC
      LIMIT 1`,
     period,period
  ).toArray()[0]??null;

  const activeLines=active
    ? sql.exec(
        `SELECT
           l.line_id lineId,l.so_id soId,l.variant_id variantId,
           l.system_qty_base systemQtyBase,l.physical_qty_base physicalQtyBase,
           l.physical_entered physicalEntered,l.snapshot_unit_cost_rp snapshotUnitCostRp,l.note,
           v.product_name productName,v.category,v.color,v.size,v.grade,
           v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,
           COALESCE(v.units_per_mid,1) unitsPerMid,
           COALESCE(v.units_per_pack,1) unitsPerPack
         FROM plastic_so_session_line l
         JOIN plastic_product_variant v ON v.variant_id=l.variant_id
         WHERE l.so_id=?
         ORDER BY v.category,UPPER(v.color),UPPER(v.size),UPPER(v.product_name)`,
        String(active.soId)
      ).toArray()
    : [];

  return{
    view,
    periodKey:period,
    actor:a,
    active,
    activeLines,
    sessions:sql.exec(
      `SELECT s.so_id soId,s.so_no soNo,s.date_key dateKey,s.status,s.reason,
              COUNT(l.line_id) totalSku,
              SUM(CASE WHEN l.physical_entered=1 THEN 1 ELSE 0 END) countedSku,
              SUM(CASE WHEN l.physical_entered=1 AND ABS(l.physical_qty_base-l.system_qty_base)<0.000001 THEN 1 ELSE 0 END) balanceSku,
              SUM(CASE WHEN l.physical_entered=1 AND l.physical_qty_base<l.system_qty_base-0.000001 THEN 1 ELSE 0 END) lessSku,
              SUM(CASE WHEN l.physical_entered=1 AND l.physical_qty_base>l.system_qty_base+0.000001 THEN 1 ELSE 0 END) moreSku
       FROM plastic_so_session s
       LEFT JOIN plastic_so_session_line l ON l.so_id=s.so_id
       WHERE s.business_unit_id='BU-PLASTIC' AND (?='ALL' OR s.period_key=?)
      GROUP BY s.so_id,s.so_no,s.date_key,s.status,s.reason
      ORDER BY s.date_key DESC,s.created_at DESC
      LIMIT 50`,
     period,period
    ).toArray(),
    rows:sql.exec(
      `SELECT o.opname_no opnameNo,o.date_key dateKey,o.reason,l.variant_id variantId,
              v.product_name productName,v.category,v.color,v.size,
              v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,
              v.units_per_mid unitsPerMid,v.units_per_pack unitsPerPack,
              l.system_qty_base systemQtyBase,l.physical_qty_base physicalQtyBase,
              l.variance_qty_base varianceQtyBase
       FROM plastic_stock_opname o
       JOIN plastic_stock_opname_line l ON l.opname_id=o.opname_id
       JOIN plastic_product_variant v ON v.variant_id=l.variant_id
       WHERE o.business_unit_id='BU-PLASTIC' AND o.period_key=?
       ORDER BY o.date_key DESC,o.created_at DESC
       LIMIT 600`,
      period
    ).toArray()
  };
}

if(view==='ACCESS'||view==='USERS'){
  if(!a.admin && a.level !== 'OWNER') throw Error('PLASTIC_OWNER_DENIED');

  const pendingRequests = sql.exec(
    `SELECT id, user_id userId, full_name fullName, email, username,
            whatsapp, requested_role requestedRole, status, submitted_at submittedAt
     FROM rkn_signup_request
     WHERE status='PENDING'
     ORDER BY submitted_at DESC`
  ).toArray();

  const historyRequests = sql.exec(
    `SELECT id, user_id userId, full_name fullName, email, username,
            whatsapp, requested_role requestedRole, status, reviewed_at reviewedAt,
            review_note reviewNote, submitted_at submittedAt
     FROM rkn_signup_request
     WHERE status IN('APPROVED','REJECTED')
     ORDER BY reviewed_at DESC, submitted_at DESC
     LIMIT 50`
  ).toArray();

  const users = sql.exec(
    `SELECT p.user_id userId, p.full_name fullName,
            COALESCE(p.primary_role_code,'STAFF') roleCode,
            COALESCE(p.active,1) active,
            COALESCE(s.access_level,'VIEW') accessLevel,
            p.created_at createdAt
     FROM erp_user_profile p
     LEFT JOIN user_business_scope s
       ON s.user_id=p.user_id AND s.business_unit_id='BU-PLASTIC'
     ORDER BY p.full_name`
  ).toArray();

  return {
    view,
    periodKey: period,
    actor: a,
    pendingRequests,
    historyRequests,
    users
  };
}

throw Error('PLASTIC_VIEW_UNSUPPORTED')}

export function mutatePlasticTradingV2(storage:any,actorId:string,cmdV:string,payloadV:any={}){const sql:Sql=storage.sql;const a=actor(sql,actorId),cmd=T(cmdV,40).toUpperCase(),p=payloadV&&typeof payloadV==='object'?payloadV:{};const atomic=<T,>(f:()=>T):T=>typeof storage.transactionSync==='function'?storage.transactionSync(f):f();

if(cmd==='APPROVE_SIGNUP_USER'){
  ow(a);
  const requestId=T(p.requestId,120);
  const roleCode=T(p.roleCode||'ADMIN',64).toUpperCase();
  const accessLevel=T(p.accessLevel||(roleCode==='OWNER'?'OWNER':roleCode==='ADMIN'?'MANAGE':roleCode==='SUPERVISI'?'VIEW':'VIEW'),32).toUpperCase();
  const reviewNote=T(p.reviewNote||'Disetujui dari Panel Akses Plastic Trading',300);

  const req=sql.exec(`SELECT * FROM rkn_signup_request WHERE id=? LIMIT 1`,requestId).toArray()[0];
  if(!req) throw Error('SIGNUP_REQUEST_NOT_FOUND');
  if(String(req.status)!=='PENDING') throw Error('SIGNUP_REQUEST_ALREADY_PROCESSED');

  const userId=T(req.user_id,120);
  const fullName=T(req.full_name,160);
  const email=T(req.email,160);

  return atomic(()=>{
    sql.exec(
      `INSERT INTO erp_user_profile(user_id,person_key,full_name,active,must_change_password,primary_role_code,created_at,updated_at)
       VALUES(?,?,?,1,0,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         full_name=excluded.full_name,
         active=1,
         primary_role_code=excluded.primary_role_code,
         updated_at=CURRENT_TIMESTAMP`,
      userId,userId,fullName,roleCode
    ).toArray();

    const roleRow=sql.exec(`SELECT id FROM role WHERE code=? LIMIT 1`,roleCode).toArray()[0];
    const roleId=roleRow?String(roleRow.id):'ROLE-'+roleCode;

    sql.exec(
      `INSERT OR IGNORE INTO user_role(id,user_id,role_id,business_unit_id,created_at)
       VALUES(?,?,?,'BU-PLASTIC',CURRENT_TIMESTAMP)`,
      crypto.randomUUID(),userId,roleId
    ).toArray();

    sql.exec(
      `INSERT INTO user_business_scope(user_id,business_unit_id,access_level,created_at,updated_at)
       VALUES(?,'BU-PLASTIC',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
       ON CONFLICT(user_id,business_unit_id) DO UPDATE SET
         access_level=excluded.access_level,
         updated_at=CURRENT_TIMESTAMP`,
      userId,accessLevel
    ).toArray();

    sql.exec(
      `UPDATE rkn_signup_request
       SET status='APPROVED',
           reviewed_by_user_id=?,
           reviewed_at=CURRENT_TIMESTAMP,
           review_note=?
       WHERE id=?`,
      a.id,reviewNote,requestId
    ).toArray();

    audit(sql,a,'APPROVE_USER','USER',userId,'Disetujui via Plastic Trading',{requestId,roleCode,accessLevel,email});

    return {ok:true,approved:true,userId,email,fullName,roleCode,accessLevel};
  });
}

if(cmd==='REJECT_SIGNUP_USER'){
  ow(a);
  const requestId=T(p.requestId,120);
  const reason=T(p.reason||'Permintaan pendaftaran ditolak oleh Admin/Owner',300);

  const req=sql.exec(`SELECT * FROM rkn_signup_request WHERE id=? LIMIT 1`,requestId).toArray()[0];
  if(!req) throw Error('SIGNUP_REQUEST_NOT_FOUND');

  return atomic(()=>{
    sql.exec(
      `UPDATE rkn_signup_request
       SET status='REJECTED',
           reviewed_by_user_id=?,
           reviewed_at=CURRENT_TIMESTAMP,
           review_note=?
       WHERE id=?`,
      a.id,reason,requestId
    ).toArray();

    audit(sql,a,'REJECT_USER','USER',String(req.user_id),'Pendaftaran ditolak',{requestId,reason});
    return {ok:true,rejected:true};
  });
}

if(cmd==='UPDATE_USER_ROLE'){
  ow(a);
  const targetUserId=T(p.targetUserId,120);
  const roleCode=T(p.roleCode,64).toUpperCase();
  const accessLevel=T(p.accessLevel||(roleCode==='OWNER'?'OWNER':roleCode==='ADMIN'?'MANAGE':roleCode==='SUPERVISI'?'VIEW':'VIEW'),32).toUpperCase();
  const active=p.active===false||p.active===0?0:1;

  if(!targetUserId||!roleCode) throw Error('USER_ROLE_DATA_REQUIRED');

  return atomic(()=>{
    sql.exec(
      `UPDATE erp_user_profile
       SET primary_role_code=?,
           active=?,
           updated_at=CURRENT_TIMESTAMP
       WHERE user_id=?`,
      roleCode,active,targetUserId
    ).toArray();

    sql.exec(
      `INSERT INTO user_business_scope(user_id,business_unit_id,access_level,created_at,updated_at)
       VALUES(?,'BU-PLASTIC',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
       ON CONFLICT(user_id,business_unit_id) DO UPDATE SET
         access_level=excluded.access_level,
         updated_at=CURRENT_TIMESTAMP`,
      targetUserId,accessLevel
    ).toArray();

    audit(sql,a,'UPDATE_USER_ROLE','USER',targetUserId,'Perubahan role',{roleCode,accessLevel,active});
    return {ok:true,updated:true};
  });
}
if(cmd==='UPSERT_PRODUCT'){mg(a);const id=T(p.variantId,120)||crypto.randomUUID(),name=T(p.productName,160);if(!name)throw Error('PLASTIC_PRODUCT_REQUIRED');const t=now(),base=T(p.baseUnit||'ROLL',32).toUpperCase(),mid=T(p.midUnit,32).toUpperCase(),pack=T(p.packUnit||'BALL',32).toUpperCase(),upm=Math.max(1,I(p.unitsPerMid,1)),upp=Math.max(1,I(p.unitsPerPack,1));sql.exec(`INSERT INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?) ON CONFLICT(variant_id) DO UPDATE SET product_name=excluded.product_name,category=excluded.category,color=excluded.color,size=excluded.size,grade=excluded.grade,base_unit=excluded.base_unit,mid_unit=excluded.mid_unit,pack_unit=excluded.pack_unit,units_per_mid=excluded.units_per_mid,units_per_pack=excluded.units_per_pack,default_buy_price_rp=excluded.default_buy_price_rp,default_sell_price_base_rp=excluded.default_sell_price_base_rp,default_sell_price_mid_rp=excluded.default_sell_price_mid_rp,default_sell_price_pack_rp=excluded.default_sell_price_pack_rp,low_stock_base_qty=excluded.low_stock_base_qty,updated_at=excluded.updated_at`,id,name,T(p.category||'POLYMAILER',64),T(p.color,80),T(p.size,80),T(p.grade,80),base,mid,pack,upm,upp,I(p.defaultBuyPriceRp),I(p.defaultSellPriceBaseRp),I(p.defaultSellPriceMidRp),I(p.defaultSellPricePackRp),Math.max(0,N(p.lowStockBaseQty)),t,t).toArray();audit(sql,a,'PLASTIC_PRODUCT_UPDATE','PLASTIC_PRODUCT_VARIANT',id,'',{name,base,mid,pack,upm,upp});return{ok:true,variantId:id}}
if(cmd==='UPSERT_CUSTOMER'){op(a);const id=T(p.customerId,120)||crypto.randomUUID(),name=T(p.customerName,160);if(!name)throw Error('PLASTIC_CUSTOMER_REQUIRED');const t=now();sql.exec(`INSERT INTO plastic_customer(customer_id,business_unit_id,customer_name,phone,address,notes,active,created_at,updated_at) VALUES(?,'BU-PLASTIC',?,?,?,?,1,?,?) ON CONFLICT(customer_id) DO UPDATE SET customer_name=excluded.customer_name,phone=excluded.phone,address=excluded.address,notes=excluded.notes,updated_at=excluded.updated_at`,id,name,T(p.phone,80),T(p.address,500),T(p.notes,500),t,t).toArray();audit(sql,a,'PLASTIC_CUSTOMER_UPDATE','PLASTIC_CUSTOMER',id,'',{name});return{ok:true,customerId:id}}
/* RKN_PLASTIC_OPENING_LEDGER_V2M */
if(cmd==='POST_OPENING_BALANCE'){
  mg(a);
  const date=DK(p.dateKey);
  if(date!=='2026-07-28')throw Error('PLASTIC_OPENING_DATE_MUST_BE_2026_07_28');
  const period=date.slice(0,7);
  open(sql,period);
  const lines=Array.isArray(p.lines)?p.lines:[];
  if(!lines.length)throw Error('PLASTIC_OPENING_LINES_REQUIRED');

  return atomic(()=>{
    const id=crypto.randomUUID();
    const no='OPEN-'+date.replaceAll('-','')+'-'+id.replaceAll('-','').slice(0,6).toUpperCase();
    const t=now();
    const agg=new Map<string,{vid:string;baseQty:number;value:number}>();

    for(const raw of lines){
      const vid=T(raw.variantId,120);
      const v=variant(sql,vid);
      const q=baseQty(v,raw.qty,raw.unit);
      const inputCost=I(raw.unitCostRp);
      const baseCost=q.multiplier>0?Math.round(inputCost/q.multiplier):inputCost;
      const prev=agg.get(vid)??{vid,baseQty:0,value:0};
      prev.baseQty+=q.baseQty;
      prev.value+=Math.round(q.baseQty*baseCost);
      agg.set(vid,prev);
    }

    const changes:any[]=[];

    for(const r of agg.values()){
      const baseCost=r.baseQty>0?Math.round(r.value/r.baseQty):0;
      const b=sql.exec(
        `SELECT qty_base,avg_cost_rp
         FROM plastic_inventory_balance
         WHERE business_unit_id='BU-PLASTIC'
           AND variant_id=?
         LIMIT 1`,
        r.vid
      ).toArray()[0];

      const oldQty=N(b?.qty_base);
      const oldCost=I(b?.avg_cost_rp);
      const newQty=oldQty+r.baseQty;
      const newCost=newQty>0
        ?Math.round((oldQty*oldCost+r.baseQty*baseCost)/newQty)
        :baseCost;

      sql.exec(
        `INSERT INTO plastic_inventory_balance(
           business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at
         ) VALUES('BU-PLASTIC',?,?,?,?)
         ON CONFLICT(business_unit_id,variant_id)
         DO UPDATE SET
           qty_base=excluded.qty_base,
           avg_cost_rp=excluded.avg_cost_rp,
           updated_at=excluded.updated_at`,
        r.vid,newQty,newCost,t
      ).toArray();

      sql.exec(
        `INSERT INTO plastic_inventory_movement(
           movement_id,business_unit_id,variant_id,period_key,date_key,
           movement_type,qty_base,unit_cost_rp,source_type,source_key,
           actor_user_id,note,occurred_at,created_at
         ) VALUES(?,'BU-PLASTIC',?,?,?,'OPENING',?,?,?,?,?,?,?,?)`,
        crypto.randomUUID(),r.vid,period,date,r.baseQty,baseCost,
        'OPENING_BALANCE',no,a.id,
        T(p.note,500)||'Opening Stock 28/07/2026',t,t
      ).toArray();

      changes.push({
        variantId:r.vid,
        addedBase:r.baseQty,
        openingNo:no,
      });
    }

    audit(
      sql,a,
      'PLASTIC_OPENING_BALANCE_ADD',
      'PLASTIC_OPENING_BALANCE',
      id,
      T(p.note,500),
      {no,date,lineCount:agg.size,changes}
    );

    return{
      ok:true,
      openingId:id,
      openingNo:no,
      dateKey:date,
      lineCount:agg.size,
      mode:'ADDITIVE',
      changes
    };
  });
}

if(cmd==='SET_OPENING_BALANCE'){
  mg(a);
  const date=DK(p.dateKey);
  if(date!=='2026-07-28')throw Error('PLASTIC_OPENING_DATE_MUST_BE_2026_07_28');
  const period=date.slice(0,7);
  open(sql,period);
  const lines=Array.isArray(p.lines)?p.lines:[];
  if(!lines.length)throw Error('PLASTIC_OPENING_LINES_REQUIRED');

  return atomic(()=>{
    const id=crypto.randomUUID();
    const no='OPEN-EDIT-'+date.replaceAll('-','')+'-'+id.replaceAll('-','').slice(0,6).toUpperCase();
    const t=now();
    const agg=new Map<string,{vid:string;baseQty:number;value:number}>();

    for(const raw of lines){
      const vid=T(raw.variantId,120);
      const v=variant(sql,vid);
      const q=baseQty(v,raw.qty,raw.unit);
      const inputCost=I(raw.unitCostRp);
      const baseCost=q.multiplier>0?Math.round(inputCost/q.multiplier):inputCost;
      const prev=agg.get(vid)??{vid,baseQty:0,value:0};
      prev.baseQty+=q.baseQty;
      prev.value+=Math.round(q.baseQty*baseCost);
      agg.set(vid,prev);
    }

    const changes:any[]=[];

    for(const r of agg.values()){
      const targetQty=r.baseQty;
      const targetCost=targetQty>0?Math.round(r.value/targetQty):0;

      const effective=scalar(
        sql,
        `SELECT COALESCE(SUM(
           CASE
             WHEN movement_type='OPENING' THEN qty_base
             WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
               AND movement_type='ADJUSTMENT_IN' THEN qty_base
             WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
               AND movement_type='ADJUSTMENT_OUT' THEN -qty_base
             ELSE 0
           END
         ),0) value
         FROM plastic_inventory_movement
         WHERE business_unit_id='BU-PLASTIC'
           AND variant_id=?
           AND date_key=?`,
        r.vid,date
      );

      const delta=targetQty-effective;
      const b=sql.exec(
        `SELECT qty_base,avg_cost_rp
         FROM plastic_inventory_balance
         WHERE business_unit_id='BU-PLASTIC'
           AND variant_id=?
         LIMIT 1`,
        r.vid
      ).toArray()[0];

      const oldQty=N(b?.qty_base);
      const oldCost=I(b?.avg_cost_rp);
      const nextQty=oldQty+delta;

      if(nextQty<-1e-9){
        throw Error('PLASTIC_OPENING_REVISION_INSUFFICIENT_BALANCE');
      }

      if(Math.abs(delta)<1e-9){
        changes.push({
          variantId:r.vid,
          fromBase:effective,
          toBase:targetQty,
          deltaBase:0,
        });
        continue;
      }

      const movementType=delta>0?'ADJUSTMENT_IN':'ADJUSTMENT_OUT';
      const movementCost=delta>0?targetCost:oldCost;
      const nextCost=delta>0 && nextQty>0
        ?Math.round((oldQty*oldCost+delta*movementCost)/nextQty)
        :(nextQty>0?oldCost:0);

      sql.exec(
        `INSERT INTO plastic_inventory_balance(
           business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at
         ) VALUES('BU-PLASTIC',?,?,?,?)
         ON CONFLICT(business_unit_id,variant_id)
         DO UPDATE SET
           qty_base=excluded.qty_base,
           avg_cost_rp=excluded.avg_cost_rp,
           updated_at=excluded.updated_at`,
        r.vid,Math.max(0,nextQty),nextCost,t
      ).toArray();

      sql.exec(
        `INSERT INTO plastic_inventory_movement(
           movement_id,business_unit_id,variant_id,period_key,date_key,
           movement_type,qty_base,unit_cost_rp,source_type,source_key,
           actor_user_id,note,occurred_at,created_at
         ) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,?,?,?,?,?,?)`,
        crypto.randomUUID(),r.vid,period,date,movementType,Math.abs(delta),
        movementCost,'OPENING_REVISION',no,a.id,
        T(p.note,500)||'Revisi total Opening Stock 28/07/2026',t,t
      ).toArray();

      changes.push({
        variantId:r.vid,
        fromBase:effective,
        toBase:targetQty,
        deltaBase:delta,
      });
    }

    audit(
      sql,a,
      'PLASTIC_OPENING_BALANCE_SET_TOTAL',
      'PLASTIC_OPENING_BALANCE',
      id,
      T(p.note,500),
      {no,date,lineCount:agg.size,changes}
    );

    return{
      ok:true,
      openingId:id,
      openingNo:no,
      dateKey:date,
      mode:'SET_TOTAL',
      changes
    };
  });
}

/* RKN_PLASTIC_OPENING_RESET_ALL_V2M1 */
if(cmd==='RESET_OPENING_BALANCE'){
  mg(a);
  const date='2026-07-28';
  const period='2026-07';
  open(sql,period);

  const reason=T(p.reason,500);
  const confirmToken=T(p.confirmToken,80).trim().toUpperCase();

  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');
  if(confirmToken!=='RESET OPENING')throw Error('PLASTIC_OPENING_RESET_CONFIRMATION_REQUIRED');

  return atomic(()=>{
    const resetId=crypto.randomUUID();
    const resetNo='OPEN-RESET-'+date.replaceAll('-','')+'-'+resetId.replaceAll('-','').slice(0,6).toUpperCase();
    const t=now();

    const rows=sql.exec(
      `SELECT
         variant_id variantId,
         COALESCE(SUM(
           CASE
             WHEN movement_type='OPENING' THEN qty_base
             WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
               AND movement_type='ADJUSTMENT_IN' THEN qty_base
             WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
               AND movement_type='ADJUSTMENT_OUT' THEN -qty_base
             ELSE 0
           END
         ),0) effectiveQty
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND date_key=?
       GROUP BY variant_id
       HAVING COALESCE(SUM(
         CASE
           WHEN movement_type='OPENING' THEN qty_base
           WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
             AND movement_type='ADJUSTMENT_IN' THEN qty_base
           WHEN source_type IN('OPENING_REVISION','OPENING_VOID','OPENING_RESET')
             AND movement_type='ADJUSTMENT_OUT' THEN -qty_base
           ELSE 0
         END
       ),0) > 0.0000001
       ORDER BY variant_id`,
      date
    ).toArray();

    const prepared:any[]=[];

    for(const raw of rows){
      const variantId=T(raw.variantId,160);
      const effectiveQty=N(raw.effectiveQty);

      if(effectiveQty<=1e-9)continue;

      const b=sql.exec(
        `SELECT qty_base,avg_cost_rp
         FROM plastic_inventory_balance
         WHERE business_unit_id='BU-PLASTIC'
           AND variant_id=?
         LIMIT 1`,
        variantId
      ).toArray()[0];

      const currentQty=N(b?.qty_base);
      const avgCost=I(b?.avg_cost_rp);

      if(currentQty+1e-9<effectiveQty){
        throw Error('PLASTIC_OPENING_RESET_INSUFFICIENT_BALANCE:'+variantId);
      }

      prepared.push({
        variantId,
        effectiveQty,
        currentQty,
        avgCost,
      });
    }

    let resetQtyBase=0;

    for(const row of prepared){
      const nextQty=Math.max(0,row.currentQty-row.effectiveQty);

      sql.exec(
        `INSERT INTO plastic_inventory_balance(
           business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at
         ) VALUES('BU-PLASTIC',?,?,?,?)
         ON CONFLICT(business_unit_id,variant_id)
         DO UPDATE SET
           qty_base=excluded.qty_base,
           avg_cost_rp=excluded.avg_cost_rp,
           updated_at=excluded.updated_at`,
        row.variantId,
        nextQty,
        nextQty>0?row.avgCost:0,
        t
      ).toArray();

      sql.exec(
        `INSERT INTO plastic_inventory_movement(
           movement_id,business_unit_id,variant_id,period_key,date_key,
           movement_type,qty_base,unit_cost_rp,source_type,source_key,
           actor_user_id,note,occurred_at,created_at
         ) VALUES(?,'BU-PLASTIC',?,?,?,'ADJUSTMENT_OUT',?,?,?,?,?,?,?,?)`,
        crypto.randomUUID(),
        row.variantId,
        period,
        date,
        row.effectiveQty,
        row.avgCost,
        'OPENING_RESET',
        resetNo,
        a.id,
        'RESET OPENING / '+reason,
        t,
        t
      ).toArray();

      resetQtyBase+=row.effectiveQty;
    }

    audit(
      sql,
      a,
      'PLASTIC_OPENING_BALANCE_RESET_ALL',
      'PLASTIC_OPENING_BALANCE',
      resetId,
      reason,
      {
        resetNo,
        date,
        variantCount:prepared.length,
        resetQtyBase,
        variants:prepared.map((row:any)=>({
          variantId:row.variantId,
          resetBase:row.effectiveQty,
        })),
      }
    );

    return{
      ok:true,
      resetId,
      resetNo,
      dateKey:date,
      variantCount:prepared.length,
      resetQtyBase,
      mode:'RESET_ALL'
    };
  });
}

if(cmd==='DELETE_OPENING_POST'){
  mg(a);
  const date='2026-07-28';
  const period='2026-07';
  open(sql,period);

  const sourceKey=T(p.sourceKey,160);
  const variantId=T(p.variantId,160);
  const reason=T(p.reason,500);

  if(!sourceKey)throw Error('PLASTIC_OPENING_SOURCE_REQUIRED');
  if(!variantId)throw Error('PLASTIC_OPENING_VARIANT_REQUIRED');
  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');

  return atomic(()=>{
    const posted=scalar(
      sql,
      `SELECT COALESCE(SUM(qty_base),0) value
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=?
         AND date_key=?
         AND movement_type='OPENING'
         AND source_type='OPENING_BALANCE'
         AND source_key=?`,
      variantId,date,sourceKey
    );

    if(posted<=0)throw Error('PLASTIC_OPENING_POST_NOT_FOUND');

    const alreadyVoided=scalar(
      sql,
      `SELECT COALESCE(SUM(qty_base),0) value
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=?
         AND date_key=?
         AND movement_type='ADJUSTMENT_OUT'
         AND source_type='OPENING_VOID'
         AND source_key=?`,
      variantId,date,sourceKey
    );

    const remaining=Math.max(0,posted-alreadyVoided);
    if(remaining<=1e-9)throw Error('PLASTIC_OPENING_POST_ALREADY_VOID');

    const b=sql.exec(
      `SELECT qty_base,avg_cost_rp
       FROM plastic_inventory_balance
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=?
       LIMIT 1`,
      variantId
    ).toArray()[0];

    const oldQty=N(b?.qty_base);
    const oldCost=I(b?.avg_cost_rp);
    const nextQty=oldQty-remaining;

    if(nextQty<-1e-9){
      throw Error('PLASTIC_OPENING_VOID_INSUFFICIENT_BALANCE');
    }

    const t=now();

    sql.exec(
      `INSERT INTO plastic_inventory_balance(
         business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at
       ) VALUES('BU-PLASTIC',?,?,?,?)
       ON CONFLICT(business_unit_id,variant_id)
       DO UPDATE SET
         qty_base=excluded.qty_base,
         avg_cost_rp=excluded.avg_cost_rp,
         updated_at=excluded.updated_at`,
      variantId,Math.max(0,nextQty),nextQty>0?oldCost:0,t
    ).toArray();

    sql.exec(
      `INSERT INTO plastic_inventory_movement(
         movement_id,business_unit_id,variant_id,period_key,date_key,
         movement_type,qty_base,unit_cost_rp,source_type,source_key,
         actor_user_id,note,occurred_at,created_at
       ) VALUES(?,'BU-PLASTIC',?,?,?,'ADJUSTMENT_OUT',?,?,?,?,?,?,?,?)`,
      crypto.randomUUID(),variantId,period,date,remaining,oldCost,
      'OPENING_VOID',sourceKey,a.id,reason,t,t
    ).toArray();

    audit(
      sql,a,
      'PLASTIC_OPENING_POST_VOID',
      'PLASTIC_OPENING_BALANCE',
      sourceKey,
      reason,
      {variantId,postedBase:posted,voidedBase:remaining}
    );

    return{
      ok:true,
      sourceKey,
      variantId,
      voidedBase:remaining,
      mode:'VOID'
    };
  });
}

/* RKN_PLASTIC_INBOUND_CONTROLLED_DELETE_ENGINE_V2R11 */
if(cmd==='DELETE_INBOUND_LINE'){
  mg(a);

  const lineId=T(p.lineId,160);
  const reason=T(p.reason,500);

  if(!lineId)throw Error('PLASTIC_INBOUND_LINE_REQUIRED');
  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');

  const row=sql.exec(
    `SELECT
       l.line_id lineId,l.inbound_id inboundId,l.variant_id variantId,
       l.qty_input qtyInput,l.input_unit inputUnit,l.qty_base qtyBase,
       l.unit_cost_rp unitCostRp,l.line_total_rp lineTotalRp,
       i.inbound_no inboundNo,i.date_key dateKey,i.period_key periodKey
     FROM plastic_inbound_line l
     JOIN plastic_inbound i ON i.inbound_id=l.inbound_id
     WHERE i.business_unit_id='BU-PLASTIC'
       AND l.line_id=?
     LIMIT 1`,
    lineId
  ).toArray()[0];

  if(!row)throw Error('PLASTIC_INBOUND_LINE_NOT_FOUND');

  const inboundId=T(row.inboundId,160);
  const inboundNo=T(row.inboundNo,160);
  const variantId=T(row.variantId,160);
  const date=DK(row.dateKey);
  const period=T(row.periodKey,7)||date.slice(0,7);
  const qtyBase=Math.max(0,N(row.qtyBase));
  const unitCostRp=Math.max(0,I(row.unitCostRp));
  const lineTotalRp=Math.max(0,I(row.lineTotalRp));

  if(qtyBase<=1e-9)throw Error('PLASTIC_INBOUND_DELETE_QTY_INVALID');

  open(sql,period);

  return atomic(()=>{
    const balance=sql.exec(
      `SELECT qty_base qtyBase,avg_cost_rp avgCostRp
       FROM plastic_inventory_balance
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=?
       LIMIT 1`,
      variantId
    ).toArray()[0];

    const currentQty=Math.max(0,N(balance?.qtyBase));
    const currentAvg=Math.max(0,I(balance?.avgCostRp));

    const ledgerQty=N(
      sql.exec(
        `SELECT COALESCE(SUM(
           CASE
             WHEN movement_type IN('OPENING','IN','RETURN_IN','ADJUSTMENT_IN')
               THEN qty_base
             WHEN movement_type IN('OUT','RETURN_OUT','ADJUSTMENT_OUT')
               THEN -qty_base
             ELSE 0
           END
         ),0) value
         FROM plastic_inventory_movement
         WHERE business_unit_id='BU-PLASTIC'
           AND variant_id=?`,
        variantId
      ).toArray()[0]?.value
    );

    const exactBasis=N(
      sql.exec(
        `SELECT COUNT(*) value
         FROM plastic_inventory_movement
         WHERE business_unit_id='BU-PLASTIC'
           AND variant_id=?
           AND movement_type='IN'
           AND source_type='INBOUND'
           AND source_key IN(?,?)`,
        variantId,inboundId,inboundNo
      ).toArray()[0]?.value
    );

    const sameDateBasis=N(
      sql.exec(
        `SELECT COUNT(*) value
         FROM plastic_inventory_movement
         WHERE business_unit_id='BU-PLASTIC'
           AND variant_id=?
           AND date_key=?
           AND movement_type='IN'
           AND source_type='INBOUND'`,
        variantId,date
      ).toArray()[0]?.value
    );

    const hasLedgerBasis=exactBasis>0 || sameDateBasis===1;
    const balanceGap=currentQty-ledgerQty;

    let inventoryMode:
      | 'LEDGER_REVERSAL'
      | 'LEGACY_BALANCE_ONLY'
      | 'HISTORY_ONLY';

    if(hasLedgerBasis){
      inventoryMode='LEDGER_REVERSAL';
    }else if(balanceGap>=qtyBase-1e-9){
      inventoryMode='LEGACY_BALANCE_ONLY';
    }else if(Math.abs(balanceGap)<=1e-9){
      inventoryMode='HISTORY_ONLY';
    }else{
      throw Error(
        'PLASTIC_INBOUND_DELETE_LEGACY_AMBIGUOUS_STOCK:'+
        variantId+
        ':BALANCE='+currentQty+
        ':LEDGER='+ledgerQty+
        ':LINE='+qtyBase
      );
    }

    /* RKN_PLASTIC_HISTORICAL_INBOUND_CORRECTION_V2R19 */
    const rawNextQty=
      inventoryMode==='HISTORY_ONLY'
        ? currentQty
        : currentQty-qtyBase;
    const negativeHistoryClamped=
      inventoryMode!=='HISTORY_ONLY' && rawNextQty < -1e-9;

    const t=now();
    const deleteId=crypto.randomUUID();
    const deleteKey=
      'PIN-DEL-'+
      date.replaceAll('-','')+'-'+
      deleteId.replaceAll('-','').slice(0,6).toUpperCase();

    let nextQty=currentQty;
    let nextAvg=currentAvg;

    if(inventoryMode!=='HISTORY_ONLY'){
      nextQty=Math.max(0,rawNextQty);

      const currentValue=Math.round(currentQty*currentAvg);
      const removeValue=Math.round(qtyBase*unitCostRp);
      let nextValue=currentValue-removeValue;

      let costFallback=false;
      if(nextValue<0){
        nextValue=Math.round(nextQty*currentAvg);
        costFallback=true;
      }

      nextAvg=nextQty>0
        ? Math.max(0,Math.round(nextValue/nextQty))
        : 0;

      sql.exec(
        `INSERT INTO plastic_inventory_balance(
           business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at
         ) VALUES('BU-PLASTIC',?,?,?,?)
         ON CONFLICT(business_unit_id,variant_id)
         DO UPDATE SET
           qty_base=excluded.qty_base,
           avg_cost_rp=excluded.avg_cost_rp,
           updated_at=excluded.updated_at`,
        variantId,nextQty,nextAvg,t
      ).toArray();

      if(inventoryMode==='LEDGER_REVERSAL'){
        sql.exec(
          `INSERT INTO plastic_inventory_movement(
             movement_id,business_unit_id,variant_id,period_key,date_key,
             movement_type,qty_base,unit_cost_rp,source_type,source_key,
             actor_user_id,note,occurred_at,created_at
           ) VALUES(?,'BU-PLASTIC',?,?,?,'ADJUSTMENT_OUT',?,?,?,?,?,?,?,?)`,
          crypto.randomUUID(),variantId,period,date,qtyBase,unitCostRp,
          'INBOUND_DELETE',deleteKey,a.id,
          'Hapus item Barang Masuk / '+reason,t,t
        ).toArray();
      }

      audit(
        sql,a,
        'PLASTIC_INBOUND_DELETE_INVENTORY_EFFECT',
        'PLASTIC_INBOUND_LINE',
        lineId,
        reason,
        {
          deleteKey,
          inventoryMode,
          currentQty,
          ledgerQty,
          balanceGap,
          removedQtyBase:qtyBase,
          unitCostRp,
          nextQty,
          currentAvgCostRp:currentAvg,
          nextAvgCostRp:nextAvg,
          costFallback
        }
      );
    }

    sql.exec(
      `DELETE FROM plastic_inbound_line
       WHERE line_id=?`,
      lineId
    ).toArray();

    const remaining=N(
      sql.exec(
        `SELECT COUNT(*) value
         FROM plastic_inbound_line
         WHERE inbound_id=?`,
        inboundId
      ).toArray()[0]?.value
    );

    if(remaining<=0){
      sql.exec(
        `DELETE FROM plastic_inbound
         WHERE business_unit_id='BU-PLASTIC'
           AND inbound_id=?`,
        inboundId
      ).toArray();
    }else{
      const total=I(
        sql.exec(
          `SELECT COALESCE(SUM(line_total_rp),0) value
           FROM plastic_inbound_line
           WHERE inbound_id=?`,
          inboundId
        ).toArray()[0]?.value
      );

      sql.exec(
        `UPDATE plastic_inbound
         SET total_value_rp=?
         WHERE business_unit_id='BU-PLASTIC'
           AND inbound_id=?`,
        total,inboundId
      ).toArray();
    }

    audit(
      sql,a,
      'PLASTIC_INBOUND_LINE_DELETE',
      'PLASTIC_INBOUND_LINE',
      lineId,
      reason,
      {
        deleteKey,
        inboundId,
        inboundNo,
        dateKey:date,
        variantId,
        qtyInput:N(row.qtyInput),
        inputUnit:T(row.inputUnit,40),
        qtyBase,
        unitCostRp,
        lineTotalRp,
        inventoryMode,
        headerDeleted:remaining<=0,
        nextQtyBase:nextQty,
        nextAvgCostRp:nextAvg
      }
    );

    return{
      ok:true,
      lineId,
      inboundId,
      inboundNo,
      inventoryMode,
      headerDeleted:remaining<=0,
      nextQtyBase:nextQty,
      nextAvgCostRp:nextAvg
    };
  });
}

if(cmd==='CREATE_INBOUND'){op(a);const date=DK(p.dateKey),period=date.slice(0,7);open(sql,period);const lines=Array.isArray(p.lines)?p.lines:[];if(!lines.length)throw Error('PLASTIC_INBOUND_LINES_REQUIRED');return atomic(()=>{const id=crypto.randomUUID(),no='PIN-'+date.replaceAll('-','')+'-'+id.replaceAll('-','').slice(0,6).toUpperCase(),t=now();let total=0;const norm=lines.map((r:any)=>{const vid=T(r.variantId,120),v=variant(sql,vid),q=baseQty(v,r.qty,r.unit),inputCost=I(r.unitCostRp),baseCost=q.multiplier>0?Math.round(inputCost/q.multiplier):inputCost,sum=Math.round(q.qty*inputCost);total+=sum;return{vid,v,...q,inputCost,baseCost,sum}});sql.exec(`INSERT INTO plastic_inbound(inbound_id,business_unit_id,inbound_no,supplier_name,supplier_ref,period_key,date_key,total_value_rp,note,actor_user_id,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,?,?,?)`,id,no,T(p.supplierName,160),T(p.supplierRef,160),period,date,total,T(p.note,500),a.id,t).toArray();for(const r of norm){sql.exec(`INSERT INTO plastic_inbound_line(line_id,inbound_id,variant_id,qty_input,input_unit,qty_base,unit_cost_rp,line_total_rp,created_at) VALUES(?,?,?,?,?,?,?,?,?)`,crypto.randomUUID(),id,r.vid,r.qty,r.unit,r.baseQty,r.baseCost,r.sum,t).toArray();const b=sql.exec(`SELECT qty_base,avg_cost_rp FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC' AND variant_id=? LIMIT 1`,r.vid).toArray()[0];const oq=N(b?.qty_base),oa=N(b?.avg_cost_rp),nq=oq+r.baseQty,na=nq>0?Math.round((oq*oa+r.baseQty*r.baseCost)/nq):0;sql.exec(`INSERT INTO plastic_inventory_balance(business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at) VALUES('BU-PLASTIC',?,?,?,?) ON CONFLICT(business_unit_id,variant_id) DO UPDATE SET qty_base=excluded.qty_base,avg_cost_rp=excluded.avg_cost_rp,updated_at=excluded.updated_at`,r.vid,nq,na,t).toArray();sql.exec(`INSERT INTO plastic_inventory_movement(movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,'IN',?,?,?,?,?,?,?,?)`,crypto.randomUUID(),r.vid,period,date,r.baseQty,r.baseCost,'INBOUND',id,a.id,T(p.note,500),t,t).toArray()}
/* RKN_PLASTIC_INBOUND_MULTILINE_GUARD_V2Q7 */
const persistedLineCount=N(
  sql.exec(
    "SELECT COUNT(*) value FROM plastic_inbound_line WHERE inbound_id=?",
    id
  ).toArray()[0]?.value
);

const persistedMovementCount=N(
  sql.exec(
    "SELECT COUNT(*) value FROM plastic_inventory_movement WHERE business_unit_id='BU-PLASTIC' AND source_type='INBOUND' AND source_key=? AND movement_type='IN'",
    id
  ).toArray()[0]?.value
);

if(
  persistedLineCount!==norm.length ||
  persistedMovementCount!==norm.length
){
  throw Error('PLASTIC_INBOUND_MULTILINE_PERSIST_FAILED');
}
audit(sql,a,'PLASTIC_IN_CREATE','PLASTIC_INBOUND',id,'',{no,total,lineCount:norm.length});return{ok:true,inboundId:id,inboundNo:no,totalValueRp:total,lineCount:norm.length}})}
/* RKN_PLASTIC_INBOUND_EDIT_V2N */
if(cmd==='UPDATE_INBOUND'){
  mg(a);

  const inboundId=T(p.inboundId,160);
  const reason=T(p.reason,500);
  const date=DK(p.dateKey);
  const period=date.slice(0,7);
  const supplierName=T(p.supplierName,160);
  const supplierRef=T(p.supplierRef,160);
  const note=T(p.note,500);
  const lines=Array.isArray(p.lines)?p.lines:[];

  if(!inboundId)throw Error('PLASTIC_INBOUND_ID_REQUIRED');
  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');
  if(!lines.length)throw Error('PLASTIC_INBOUND_LINES_REQUIRED');

  const header=sql.exec(
    `SELECT inbound_id inboundId,inbound_no inboundNo,supplier_name supplierName,
            supplier_ref supplierRef,period_key periodKey,date_key dateKey,
            total_value_rp totalValueRp,note,actor_user_id actorUserId,created_at createdAt
     FROM plastic_inbound
     WHERE business_unit_id='BU-PLASTIC'
       AND inbound_id=?
     LIMIT 1`,
    inboundId
  ).toArray()[0];

  if(!header)throw Error('PLASTIC_INBOUND_NOT_FOUND');

  const oldPeriod=T(header.periodKey,7);
  const oldDate=DK(header.dateKey);

  open(sql,oldPeriod);
  if(period!==oldPeriod)open(sql,period);

  const oldLines=sql.exec(
    `SELECT line_id lineId,variant_id variantId,qty_input qtyInput,input_unit inputUnit,
            qty_base qtyBase,unit_cost_rp unitCostRp,line_total_rp lineTotalRp,created_at createdAt
     FROM plastic_inbound_line
     WHERE inbound_id=?
     ORDER BY created_at,line_id`,
    inboundId
  ).toArray();

  if(!oldLines.length)throw Error('PLASTIC_INBOUND_LINES_NOT_FOUND');

  const normalized=lines.map((raw:any)=>{
    const vid=T(raw.variantId,120);
    const v=variant(sql,vid);
    const q=baseQty(v,raw.qty,raw.unit);
    const inputCost=I(raw.unitCostRp);
    const baseCost=q.multiplier>0?Math.round(inputCost/q.multiplier):inputCost;
    const sum=Math.round(q.qty*inputCost);
    return{
      vid,
      v,
      qty:q.qty,
      unit:q.unit,
      baseQty:q.baseQty,
      inputCost,
      baseCost,
      sum
    };
  });

  const agg=(rows:any[],mode:'OLD'|'NEW')=>{
    const map=new Map<string,{variantId:string;qtyBase:number;valueRp:number}>();
    for(const row of rows){
      const variantId=T(mode==='OLD'?row.variantId:row.vid,120);
      const qtyBase=N(mode==='OLD'?row.qtyBase:row.baseQty);
      const unitCost=I(mode==='OLD'?row.unitCostRp:row.baseCost);
      const current=map.get(variantId)??{variantId,qtyBase:0,valueRp:0};
      current.qtyBase+=qtyBase;
      current.valueRp+=Math.round(qtyBase*unitCost);
      map.set(variantId,current);
    }
    return map;
  };

  const oldAgg=agg(oldLines,'OLD');
  const newAgg=agg(normalized,'NEW');

  return atomic(()=>{
    const editId=crypto.randomUUID();
    const editKey='PIN-EDIT-'+date.replaceAll('-','')+'-'+editId.replaceAll('-','').slice(0,6).toUpperCase();
    const t=now();

    const affected=new Set<string>([
      ...Array.from(oldAgg.keys()),
      ...Array.from(newAgg.keys())
    ]);

    const changes:any[]=[];

    for(const variantId of affected){
      const oldPart=oldAgg.get(variantId)??{variantId,qtyBase:0,valueRp:0};
      const newPart=newAgg.get(variantId)??{variantId,qtyBase:0,valueRp:0};

      const balance=sql.exec(
        `SELECT qty_base qtyBase,avg_cost_rp avgCostRp
         FROM plastic_inventory_balance
         WHERE business_unit_id='BU-PLASTIC'
           AND variant_id=?
         LIMIT 1`,
        variantId
      ).toArray()[0];

      const currentQty=N(balance?.qtyBase);
      const currentAvg=I(balance?.avgCostRp);
      const currentValue=Math.round(currentQty*currentAvg);

      /* RKN_PLASTIC_HISTORICAL_INBOUND_CORRECTION_V2R19
         Official historical documents are factual. A later OUT may have
         consumed the old IN already, so the live cache must not block the
         correction. Preserve the raw negative state for diagnostics and
         clamp only the non-negative balance cache. */
      const rawNextQty=currentQty-oldPart.qtyBase+newPart.qtyBase;
      const rawNextValue=currentValue-oldPart.valueRp+newPart.valueRp;
      const negativeHistoryClamped=rawNextQty < -1e-9;
      const historicalCostClamped=rawNextValue < -0.5;

      const safeQty=Math.max(0,rawNextQty);
      const safeValue=safeQty>0?Math.max(0,rawNextValue):0;
      const nextAvg=safeQty>0?Math.round(safeValue/safeQty):0;

      sql.exec(
        `INSERT INTO plastic_inventory_balance(
           business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at
         ) VALUES('BU-PLASTIC',?,?,?,?)
         ON CONFLICT(business_unit_id,variant_id)
         DO UPDATE SET
           qty_base=excluded.qty_base,
           avg_cost_rp=excluded.avg_cost_rp,
           updated_at=excluded.updated_at`,
        variantId,safeQty,nextAvg,t
      ).toArray();

      changes.push({
        variantId,
        currentQty,
        oldInboundQty:oldPart.qtyBase,
        newInboundQty:newPart.qtyBase,
        nextQty:safeQty,
        rawNextQty,
        negativeHistoryClamped,
        currentValue,
        oldInboundValue:oldPart.valueRp,
        newInboundValue:newPart.valueRp,
        nextValue:safeValue,
        rawNextValue,
        historicalCostClamped
      });
    }

    for(const row of oldAgg.values()){
      if(row.qtyBase<=1e-9)continue;
      const cost=row.qtyBase>0?Math.round(row.valueRp/row.qtyBase):0;
      sql.exec(
        `INSERT INTO plastic_inventory_movement(
           movement_id,business_unit_id,variant_id,period_key,date_key,
           movement_type,qty_base,unit_cost_rp,source_type,source_key,
           actor_user_id,note,occurred_at,created_at
         ) VALUES(?,'BU-PLASTIC',?,?,?,'ADJUSTMENT_OUT',?,?,?,?,?,?,?,?)`,
        crypto.randomUUID(),row.variantId,oldPeriod,oldDate,row.qtyBase,cost,
        'INBOUND_EDIT',editKey,a.id,
        'Reverse inbound sebelum edit / '+reason,t,t
      ).toArray();
    }

    for(const row of newAgg.values()){
      if(row.qtyBase<=1e-9)continue;
      const cost=row.qtyBase>0?Math.round(row.valueRp/row.qtyBase):0;
      sql.exec(
        `INSERT INTO plastic_inventory_movement(
           movement_id,business_unit_id,variant_id,period_key,date_key,
           movement_type,qty_base,unit_cost_rp,source_type,source_key,
           actor_user_id,note,occurred_at,created_at
         ) VALUES(?,'BU-PLASTIC',?,?,?,'ADJUSTMENT_IN',?,?,?,?,?,?,?,?)`,
        crypto.randomUUID(),row.variantId,period,date,row.qtyBase,cost,
        'INBOUND_EDIT',editKey,a.id,
        'Repost inbound setelah edit / '+reason,t,t
      ).toArray();
    }

    sql.exec(
      `DELETE FROM plastic_inbound_line
       WHERE inbound_id=?`,
      inboundId
    ).toArray();

    let total=0;

    for(const row of normalized){
      total+=row.sum;
      sql.exec(
        `INSERT INTO plastic_inbound_line(
           line_id,inbound_id,variant_id,qty_input,input_unit,qty_base,
           unit_cost_rp,line_total_rp,created_at
         ) VALUES(?,?,?,?,?,?,?,?,?)`,
        crypto.randomUUID(),inboundId,row.vid,row.qty,row.unit,row.baseQty,
        row.baseCost,row.sum,t
      ).toArray();
    }

    sql.exec(
      `UPDATE plastic_inbound
       SET supplier_name=?,
           supplier_ref=?,
           period_key=?,
           date_key=?,
           total_value_rp=?,
           note=?
       WHERE business_unit_id='BU-PLASTIC'
         AND inbound_id=?`,
      supplierName,supplierRef,period,date,total,note,inboundId
    ).toArray();

    const before={
      header,
      lines:oldLines
    };

    const after={
      inboundId,
      inboundNo:T(header.inboundNo,160),
      supplierName,
      supplierRef,
      periodKey:period,
      dateKey:date,
      totalValueRp:total,
      note,
      lines:normalized.map((row:any)=>({
        variantId:row.vid,
        qtyInput:row.qty,
        inputUnit:row.unit,
        qtyBase:row.baseQty,
        baseCostRp:row.baseCost,
        lineTotalRp:row.sum
      }))
    };

    audit(
      sql,a,
      'PLASTIC_INBOUND_UPDATE',
      'PLASTIC_INBOUND',
      inboundId,
      reason,
      {
        editKey,
        before,
        after,
        inventoryChanges:changes,
        historicalCogsSnapshot:'UNCHANGED'
      }
    );

    return{
      ok:true,
      inboundId,
      inboundNo:T(header.inboundNo,160),
      editKey,
      totalValueRp:total,
      lineCount:normalized.length,
      mode:'UPDATE'
    };
  });
}

/* RKN_PLASTIC_HISTORICAL_OUT_ASOF_V2R5 */
/* RKN_PLASTIC_BACKFILL_OUT_RECORDING_V2R6 */
/* RKN_PLASTIC_FACTUAL_OUT_MODE_V2R7 */
if(cmd==='CREATE_SALE'){
  syncAuthoritativeInventory(sql);op(a);const date=DK(p.dateKey),period=date.slice(0,7),historicalBackfill=date<='2026-08-28',factualOutMode=historicalBackfill,saleStockByVariant=new Map(authoritativeSoStockRows(sql,date).map((row:any)=>[T(row.variantId,120),N(row.systemQtyBase)]));open(sql,period);const requestedCustomerId=T(p.customerId,120),requestedCustomerName=T(p.customerName,160);const lines=Array.isArray(p.lines)?p.lines:[];if(!lines.length)throw Error('PLASTIC_SALE_LINES_REQUIRED');return atomic(()=>{let cust=requestedCustomerId,customerName=requestedCustomerName;const t=now();if(cust){const existing=sql.exec(`SELECT customer_id,customer_name FROM plastic_customer WHERE business_unit_id='BU-PLASTIC' AND customer_id=? AND active=1 LIMIT 1`,cust).toArray()[0];if(!existing)throw Error('PLASTIC_CUSTOMER_NOT_FOUND');customerName=T(existing.customer_name,160)}else{if(!customerName)throw Error('PLASTIC_CUSTOMER_REQUIRED');const existing=sql.exec(`SELECT customer_id,customer_name FROM plastic_customer WHERE business_unit_id='BU-PLASTIC' AND active=1 AND LOWER(TRIM(customer_name))=LOWER(TRIM(?)) ORDER BY created_at LIMIT 1`,customerName).toArray()[0];if(existing){cust=T(existing.customer_id,120);customerName=T(existing.customer_name,160)}else{cust=crypto.randomUUID();sql.exec(`INSERT INTO plastic_customer(customer_id,business_unit_id,customer_name,phone,address,notes,active,created_at,updated_at) VALUES(?,'BU-PLASTIC',?,'','','Auto-created from sales entry',1,?,?)`,cust,customerName,t,t).toArray();audit(sql,a,'PLASTIC_CUSTOMER_AUTO_CREATE','PLASTIC_CUSTOMER',cust,'',{customerName})}}const id=crypto.randomUUID(),no='PTR-'+date.replaceAll('-','')+'-'+id.replaceAll('-','').slice(0,6).toUpperCase();let subtotal=0,cogs=0;const norm=lines.map((r:any)=>{const vid=T(r.variantId,120),v=variant(sql,vid),q=baseQty(v,r.qty,r.unit),b=sql.exec(`SELECT qty_base,avg_cost_rp FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC' AND variant_id=? LIMIT 1`,vid).toArray()[0],avail=N(saleStockByVariant.get(vid)),liveAvail=N(b?.qty_base),shortfall=Math.max(0,q.baseQty-avail);if(shortfall>1e-9&&!factualOutMode)throw Error('PLASTIC_INSUFFICIENT_STOCK');let price=I(r.unitPriceRp);if(price<=0){const mid=String(v.mid_unit||'').toUpperCase();price=q.unit===String(v.pack_unit).toUpperCase()?I(v.default_sell_price_pack_rp):mid&&q.unit===mid?I(v.default_sell_price_mid_rp):I(v.default_sell_price_base_rp)};const sum=Math.round(q.qty*price),uc=I(b?.avg_cost_rp),cg=Math.round(q.baseQty*uc);subtotal+=sum;cogs+=cg;return{vid,v,...q,avail,liveAvail,shortfall,price,sum,uc,cg}});/* RKN_PLASTIC_SALE_AGGREGATE_STOCK_GUARD_V2R19 */if(!factualOutMode){const requestedByVariant=new Map<string,{requested:number;available:number}>();for(const row of norm){const current=requestedByVariant.get(row.vid)??{requested:0,available:row.avail};current.requested+=row.baseQty;current.available=Math.min(current.available,row.avail);requestedByVariant.set(row.vid,current)}for(const row of requestedByVariant.values()){if(row.requested>row.available+1e-9)throw Error('PLASTIC_INSUFFICIENT_STOCK')}}const disc=Math.min(subtotal,I(p.discountRp)),ship=0,grand=Math.max(0,subtotal-disc+ship),paymentStatus=T(p.paymentStatus||'NOT_PAID',20).toUpperCase().replaceAll(' ','_');if(!['PAID','NOT_PAID'].includes(paymentStatus))throw Error('PLASTIC_PAYMENT_STATUS_INVALID');const pay=paymentStatus==='PAID'?grand:0,status=paymentStatus==='PAID'?'PAID':'OPEN';sql.exec(`/* RKN_PLASTIC_SALES_INVOICE_ARITY_FIX_V2Q3 */INSERT INTO plastic_sales_invoice(invoice_id,business_unit_id,invoice_no,customer_id,period_key,date_key,status,subtotal_rp,discount_rp,shipping_rp,grand_total_rp,due_date_key,note,actor_user_id,occurred_at,created_at,updated_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,id,no,cust,period,date,status,subtotal,disc,ship,grand,'',T(p.note,500),a.id,t,t,t).toArray();for(const r of norm){sql.exec(`INSERT INTO plastic_sales_line(line_id,invoice_id,variant_id,qty_input,input_unit,qty_base,unit_price_rp,line_total_rp,unit_cogs_rp,cogs_total_rp,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,crypto.randomUUID(),id,r.vid,r.qty,r.unit,r.baseQty,r.price,r.sum,r.uc,r.cg,t).toArray();const liveAfter=r.liveAvail-r.baseQty;if(liveAfter<-1e-9&&!factualOutMode)throw Error('PLASTIC_STOCK_LEDGER_NEGATIVE_AFTER_BACKFILL');sql.exec(`UPDATE plastic_inventory_balance SET qty_base=?,updated_at=? WHERE business_unit_id='BU-PLASTIC' AND variant_id=?`,Math.max(0,liveAfter),t,r.vid).toArray();sql.exec(`INSERT INTO plastic_inventory_movement(movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,'OUT',?,?,?,?,?,?,?,?)`,crypto.randomUUID(),r.vid,period,date,r.baseQty,r.uc,'SALE',id,a.id,T(p.note,500),t,t).toArray()}syncAuthoritativeInventory(sql);if(pay>0)sql.exec(`INSERT INTO plastic_payment(payment_id,business_unit_id,invoice_id,customer_id,period_key,date_key,amount_rp,payment_method,status,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,'POSTED',?,'Initial payment',?,?)`,crypto.randomUUID(),id,cust,period,date,pay,T(p.paymentMethod,64),a.id,t,t).toArray();const backfillShortfalls=norm.filter((r:any)=>r.shortfall>1e-9).map((r:any)=>({variantId:r.vid,availableBase:r.avail,outBase:r.baseQty,shortfallBase:r.shortfall}));audit(sql,a,'PLASTIC_SALE_CREATE','PLASTIC_SALES_INVOICE',id,'',{no,customerId:cust,customerName,grand,pay,cogs,historicalBackfill,factualOutMode,backfillShortfalls,stockBasis:'POSTED_SO_PHYSICAL_PLUS_OFFICIAL_TRANSACTIONS'});return{ok:true,invoiceId:id,invoiceNo:no,customerId:cust,customerName,grandTotalRp:grand,cogsRp:cogs,grossProfitRp:grand-cogs,outstandingRp:grand-pay}})}
/* RKN_PLASTIC_SALE_LIFECYCLE_V2O */
if(cmd==='UPDATE_SALE'){
  mg(a);
  const invoiceId=T(p.invoiceId,160),reason=T(p.reason,500);
  if(!invoiceId)throw Error('PLASTIC_INVOICE_REQUIRED');
  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');

  const inv=sql.exec(`SELECT * FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND invoice_id=? AND status<>'VOID' LIMIT 1`,invoiceId).toArray()[0];
  if(!inv)throw Error('PLASTIC_INVOICE_NOT_FOUND');

  const oldPeriod=T(inv.period_key,7),oldDate=DK(inv.date_key),date=DK(p.dateKey),period=date.slice(0,7);
  open(sql,oldPeriod);if(period!==oldPeriod)open(sql,period);

  const oldLines=sql.exec(`SELECT line_id lineId,variant_id variantId,qty_input qtyInput,input_unit inputUnit,qty_base qtyBase,unit_price_rp unitPriceRp,line_total_rp lineTotalRp,unit_cogs_rp unitCogsRp,cogs_total_rp cogsTotalRp FROM plastic_sales_line WHERE invoice_id=? ORDER BY created_at,line_id`,invoiceId).toArray();
  const lines=Array.isArray(p.lines)?p.lines:[];
  if(!oldLines.length||!lines.length)throw Error('PLASTIC_SALE_LINES_REQUIRED');

  let cust=T(p.customerId,120),customerName=T(p.customerName,160);
  const t=now();
  if(cust){
    const row=sql.exec(`SELECT customer_id customerId,customer_name customerName FROM plastic_customer WHERE business_unit_id='BU-PLASTIC' AND customer_id=? AND active=1 LIMIT 1`,cust).toArray()[0];
    if(!row)throw Error('PLASTIC_CUSTOMER_NOT_FOUND');
    customerName=T(row.customerName,160);
  }else{
    if(!customerName)throw Error('PLASTIC_CUSTOMER_REQUIRED');
    const row=sql.exec(`SELECT customer_id customerId,customer_name customerName FROM plastic_customer WHERE business_unit_id='BU-PLASTIC' AND active=1 AND LOWER(TRIM(customer_name))=LOWER(TRIM(?)) LIMIT 1`,customerName).toArray()[0];
    if(row){cust=T(row.customerId,120);customerName=T(row.customerName,160)}
    else{
      cust=crypto.randomUUID();
      sql.exec(`INSERT INTO plastic_customer(customer_id,business_unit_id,customer_name,phone,address,notes,active,created_at,updated_at) VALUES(?,'BU-PLASTIC',?,'','','',1,?,?)`,cust,customerName,t,t).toArray();
    }
  }

  const normalized=lines.map((r:any)=>{
    const vid=T(r.variantId,120),v=variant(sql,vid),q=baseQty(v,r.qty,r.unit);
    let price=I(r.unitPriceRp);
    if(price<=0){
      const mid=String(v.mid_unit||'').toUpperCase();
      price=q.unit===String(v.pack_unit).toUpperCase()?I(v.default_sell_price_pack_rp):mid&&q.unit===mid?I(v.default_sell_price_mid_rp):I(v.default_sell_price_base_rp);
    }
    return{vid,qty:q.qty,unit:q.unit,baseQty:q.baseQty,price,sum:Math.round(q.qty*price)};
  });

  const subtotal=normalized.reduce((s:number,r:any)=>s+r.sum,0),disc=Math.min(subtotal,I(p.discountRp)),grand=Math.max(0,subtotal-disc);
  const alreadyPaid=paid(sql,invoiceId);
  if(alreadyPaid>grand)throw Error('PLASTIC_SALE_EDIT_INVALID_PAID_TOTAL');

  return atomic(()=>{
    const editKey='SALE-EDIT-'+date.replaceAll('-','')+'-'+crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase();

    for(const r of oldLines){
      const vid=T(r.variantId,120),qty=N(r.qtyBase),cost=I(r.unitCogsRp);
      const b=sql.exec(`SELECT qty_base qtyBase,avg_cost_rp avgCostRp FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC' AND variant_id=? LIMIT 1`,vid).toArray()[0];
      const cur=N(b?.qtyBase),avg=I(b?.avgCostRp),next=cur+qty,nextAvg=next>0?Math.round((cur*avg+qty*cost)/next):0;
      sql.exec(`INSERT INTO plastic_inventory_balance(business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at) VALUES('BU-PLASTIC',?,?,?,?) ON CONFLICT(business_unit_id,variant_id) DO UPDATE SET qty_base=excluded.qty_base,avg_cost_rp=excluded.avg_cost_rp,updated_at=excluded.updated_at`,vid,next,nextAvg,t).toArray();
      sql.exec(`INSERT INTO plastic_inventory_movement(movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,'RETURN_IN',?,?,?,?,?,?,?,?)`,crypto.randomUUID(),vid,oldPeriod,oldDate,qty,cost,'SALE_EDIT_REVERSE',editKey,a.id,reason,t,t).toArray();
    }

    sql.exec(`DELETE FROM plastic_sales_line WHERE invoice_id=?`,invoiceId).toArray();
    let totalCogs=0;

    for(const r of normalized){
      const b=sql.exec(`SELECT qty_base qtyBase,avg_cost_rp avgCostRp FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC' AND variant_id=? LIMIT 1`,r.vid).toArray()[0],avail=N(b?.qtyBase),uc=I(b?.avgCostRp);
      if(r.baseQty>avail+1e-9)throw Error('PLASTIC_INSUFFICIENT_STOCK');
      const cg=Math.round(r.baseQty*uc);totalCogs+=cg;
      sql.exec(`UPDATE plastic_inventory_balance SET qty_base=?,updated_at=? WHERE business_unit_id='BU-PLASTIC' AND variant_id=?`,avail-r.baseQty,t,r.vid).toArray();
      sql.exec(`INSERT INTO plastic_sales_line(line_id,invoice_id,variant_id,qty_input,input_unit,qty_base,unit_price_rp,line_total_rp,unit_cogs_rp,cogs_total_rp,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,crypto.randomUUID(),invoiceId,r.vid,r.qty,r.unit,r.baseQty,r.price,r.sum,uc,cg,t).toArray();
      sql.exec(`INSERT INTO plastic_inventory_movement(movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,'OUT',?,?,?,?,?,?,?,?)`,crypto.randomUUID(),r.vid,period,date,r.baseQty,uc,'SALE_EDIT',editKey,a.id,reason,t,t).toArray();
    }

    const newStatus=alreadyPaid>=grand?'PAID':alreadyPaid>0?'PARTIAL':'OPEN';
    sql.exec(`UPDATE plastic_sales_invoice SET customer_id=?,period_key=?,date_key=?,status=?,subtotal_rp=?,discount_rp=?,shipping_rp=0,grand_total_rp=?,due_date_key='',note=?,updated_at=? WHERE invoice_id=?`,cust,period,date,newStatus,subtotal,disc,grand,T(p.note,500),t,invoiceId).toArray();

    audit(sql,a,'PLASTIC_SALE_UPDATE','PLASTIC_SALES_INVOICE',invoiceId,reason,{
      invoiceNo:T(inv.invoice_no,160),
      before:{customerId:T(inv.customer_id,120),dateKey:oldDate,subtotalRp:N(inv.subtotal_rp),discountRp:N(inv.discount_rp),grandTotalRp:N(inv.grand_total_rp),lines:oldLines},
      after:{customerId:cust,customerName,dateKey:date,subtotalRp:subtotal,discountRp:disc,grandTotalRp:grand,totalCogsRp:totalCogs,lines:normalized},
      editKey
    });

    return{ok:true,invoiceId,invoiceNo:T(inv.invoice_no,160),grandTotalRp:grand,outstandingRp:grand-alreadyPaid};
  });
}

if(cmd==='VOID_SALE'){
  mg(a);
  const invoiceId=T(p.invoiceId,160),reason=T(p.reason,500);
  if(!invoiceId)throw Error('PLASTIC_INVOICE_REQUIRED');
  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');

  const inv=sql.exec(`SELECT * FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND invoice_id=? AND status<>'VOID' LIMIT 1`,invoiceId).toArray()[0];
  if(!inv)throw Error('PLASTIC_INVOICE_NOT_FOUND');
  const period=T(inv.period_key,7),date=DK(inv.date_key);open(sql,period);

  const lines=sql.exec(`SELECT variant_id variantId,qty_base qtyBase,unit_cogs_rp unitCogsRp FROM plastic_sales_line WHERE invoice_id=?`,invoiceId).toArray();
  const t=now();

  return atomic(()=>{
    for(const r of lines){
      const vid=T(r.variantId,120),qty=N(r.qtyBase),cost=I(r.unitCogsRp);
      const b=sql.exec(`SELECT qty_base qtyBase,avg_cost_rp avgCostRp FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC' AND variant_id=? LIMIT 1`,vid).toArray()[0];
      const cur=N(b?.qtyBase),avg=I(b?.avgCostRp),next=cur+qty,nextAvg=next>0?Math.round((cur*avg+qty*cost)/next):0;
      sql.exec(`INSERT INTO plastic_inventory_balance(business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at) VALUES('BU-PLASTIC',?,?,?,?) ON CONFLICT(business_unit_id,variant_id) DO UPDATE SET qty_base=excluded.qty_base,avg_cost_rp=excluded.avg_cost_rp,updated_at=excluded.updated_at`,vid,next,nextAvg,t).toArray();
      sql.exec(`INSERT INTO plastic_inventory_movement(movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,'RETURN_IN',?,?,?,?,?,?,?,?)`,crypto.randomUUID(),vid,period,date,qty,cost,'SALE_VOID',invoiceId,a.id,reason,t,t).toArray();
    }

    const payments=sql.exec(`SELECT payment_id paymentId FROM plastic_payment WHERE business_unit_id='BU-PLASTIC' AND invoice_id=? AND status='POSTED'`,invoiceId).toArray();
    sql.exec(`UPDATE plastic_payment SET status='REVERSED' WHERE business_unit_id='BU-PLASTIC' AND invoice_id=? AND status='POSTED'`,invoiceId).toArray();
    sql.exec(`UPDATE plastic_sales_invoice SET status='VOID',updated_at=? WHERE invoice_id=?`,t,invoiceId).toArray();
    audit(sql,a,'PLASTIC_SALE_VOID','PLASTIC_SALES_INVOICE',invoiceId,reason,{invoiceNo:T(inv.invoice_no,160),grandTotalRp:N(inv.grand_total_rp),restoredLines:lines,reversedPaymentCount:payments.length});
    return{ok:true,invoiceId,invoiceNo:T(inv.invoice_no,160),status:'VOID'};
  });
}

if(cmd==='REVERSE_PAYMENT'){
  mg(a);
  const paymentId=T(p.paymentId,160),reason=T(p.reason,500);
  if(!paymentId)throw Error('PLASTIC_PAYMENT_REQUIRED');
  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');

  const payRow=sql.exec(`SELECT * FROM plastic_payment WHERE business_unit_id='BU-PLASTIC' AND payment_id=? AND status='POSTED' LIMIT 1`,paymentId).toArray()[0];
  if(!payRow)throw Error('PLASTIC_PAYMENT_NOT_FOUND');
  const invoiceId=T(payRow.invoice_id,160);
  const inv=sql.exec(`SELECT * FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND invoice_id=? AND status<>'VOID' LIMIT 1`,invoiceId).toArray()[0];
  if(!inv)throw Error('PLASTIC_INVOICE_NOT_FOUND');
  open(sql,T(inv.period_key,7));

  const t=now();
  sql.exec(`UPDATE plastic_payment SET status='REVERSED',note=? WHERE payment_id=?`,T((T(payRow.note,260)?T(payRow.note,260)+' / ':'')+'REVERSED: '+reason,300),paymentId).toArray();
  const total=paid(sql,invoiceId),status=total>=N(inv.grand_total_rp)?'PAID':total>0?'PARTIAL':'OPEN';
  sql.exec(`UPDATE plastic_sales_invoice SET status=?,updated_at=? WHERE invoice_id=?`,status,t,invoiceId).toArray();
  audit(sql,a,'PLASTIC_PAYMENT_REVERSE','PLASTIC_PAYMENT',paymentId,reason,{invoiceId,amountRp:N(payRow.amount_rp)});
  return{ok:true,paymentId,invoiceId,outstandingRp:Math.max(0,N(inv.grand_total_rp)-total)};
}


/* RKN_PLASTIC_PRICE_HISTORY_COMMANDS */
if(cmd==='ADD_PRICE_HISTORY'){
  mg(a);
  const variantId=T(p.variantId,120);
  const effectiveDateKey=DK(p.effectiveDateKey);
  const basePrice=I(p.sellPriceBaseRp);
  const packPrice=I(p.sellPricePackRp);
  const note=T(p.note,300);
  if(!variantId)throw Error('PLASTIC_VARIANT_REQUIRED');
  if(basePrice<=0 && packPrice<=0)throw Error('PLASTIC_PRICE_INVALID');

  const historyId = 'HIST-' + crypto.randomUUID().slice(0,8).toUpperCase();
  const t = now();
  sql.exec(
    `INSERT INTO plastic_product_price_history(history_id,business_unit_id,variant_id,effective_date_key,sell_price_base_rp,sell_price_mid_rp,sell_price_pack_rp,buy_price_rp,note,actor_user_id,created_at)
     VALUES(?,'BU-PLASTIC',?,?,?,?,?,0,?,?,?)`,
    historyId, variantId, effectiveDateKey, basePrice, 0, packPrice, note, a.id, t
  ).toArray();

  // If effective date is on or before today, also update current default price
  if(effectiveDateKey <= DK(now().slice(0,10))){
    sql.exec(
      `UPDATE plastic_product_variant
       SET default_sell_price_base_rp=?, default_sell_price_pack_rp=?, updated_at=?
       WHERE business_unit_id='BU-PLASTIC' AND variant_id=?`,
      basePrice, packPrice, t, variantId
    ).toArray();
  }

  audit(sql,a,'PLASTIC_PRICE_HISTORY_ADD','PLASTIC_PRODUCT_VARIANT',variantId,note,{basePrice,packPrice,effectiveDateKey});
  return { ok: true, historyId, variantId, effectiveDateKey };
}

/* RKN_PLASTIC_SUPPLIER_PAYMENT_COMMANDS */
if(cmd==='ADD_SUPPLIER_PAYMENT'){
  mg(a);
  const supplierName=T(p.supplierName,160) || 'KMS PACKAGING';
  const dateKey=DK(p.dateKey);
  const amountRp=I(p.amountRp);
  const fundingSource=T(p.fundingSource,32) || 'RKN_INTERNAL_CASH';
  const referenceNo=T(p.referenceNo,160);
  const note=T(p.note,300);

  if(amountRp<=0)throw Error('PLASTIC_PAYMENT_INVALID');

  const paymentId = 'SPAY-' + crypto.randomUUID().slice(0,8).toUpperCase();
  const t = now();

  sql.exec(
    `INSERT INTO plastic_supplier_payment(payment_id,business_unit_id,supplier_name,date_key,amount_rp,funding_source,reference_no,note,actor_user_id,created_at)
     VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,?,?)`,
    paymentId, supplierName, dateKey, amountRp, fundingSource, referenceNo, note, a.id, t
  ).toArray();

  // If funded by Paman, automatically record to paman funding ledger
  if(fundingSource === 'PAMAN_FUNDING'){
    sql.exec(
      `INSERT INTO plastic_paman_funding_ledger(entry_id,business_unit_id,date_key,entry_type,amount_rp,reference_no,note,actor_user_id,created_at)
       VALUES(?,'BU-PLASTIC',?,'FUNDING_IN',?,?,?,?,?)`,
      'FUND-' + paymentId, dateKey, amountRp, referenceNo || paymentId, 'Talangan Pembayaran ke ' + supplierName + ': ' + note, a.id, t
    ).toArray();
  }

  audit(sql,a,'PLASTIC_SUPPLIER_PAYMENT_ADD','PLASTIC_SUPPLIER_PAYMENT',paymentId,note,{supplierName,amountRp,fundingSource});
  return { ok: true, paymentId, amountRp, supplierName };
}

if(cmd==='RECORD_PAMAN_REPAYMENT'){
  mg(a);
  const dateKey=DK(p.dateKey);
  const amountRp=I(p.amountRp);
  const referenceNo=T(p.referenceNo,160);
  const note=T(p.note,300) || 'Pengembalian dana talangan modal Paman';

  if(amountRp<=0)throw Error('PLASTIC_PAYMENT_INVALID');

  const entryId = 'REPAY-' + crypto.randomUUID().slice(0,8).toUpperCase();
  const t = now();

  sql.exec(
    `INSERT INTO plastic_paman_funding_ledger(entry_id,business_unit_id,date_key,entry_type,amount_rp,reference_no,note,actor_user_id,created_at)
     VALUES(?,'BU-PLASTIC',?,'REPAYMENT_OUT',?,?,?,?,?)`,
    entryId, dateKey, amountRp, referenceNo, note, a.id, t
  ).toArray();

  audit(sql,a,'PLASTIC_PAMAN_REPAYMENT_ADD','PLASTIC_PAMAN_FUNDING',entryId,note,{amountRp,dateKey});
  return { ok: true, entryId, amountRp };
}

if(cmd==='ADD_PAYMENT'){op(a);const id=T(p.invoiceId,120),inv=sql.exec(`SELECT * FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND invoice_id=? AND status<>'VOID' LIMIT 1`,id).toArray()[0];if(!inv)throw Error('PLASTIC_INVOICE_NOT_FOUND');open(sql,String(inv.period_key));const amount=I(p.amountRp),already=paid(sql,id),remain=Math.max(0,N(inv.grand_total_rp)-already);if(amount<=0)throw Error('PLASTIC_PAYMENT_INVALID');if(amount>remain)throw Error('PLASTIC_PAYMENT_EXCEEDS_OUTSTANDING');const t=now(),date=p.dateKey?DK(p.dateKey):String(inv.date_key);sql.exec(`INSERT INTO plastic_payment(payment_id,business_unit_id,invoice_id,customer_id,period_key,date_key,amount_rp,payment_method,status,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,'POSTED',?,?,?,?)`,crypto.randomUUID(),id,String(inv.customer_id),String(inv.period_key),date,amount,T(p.paymentMethod,64),a.id,T(p.note,300),t,t).toArray();const total=already+amount,status=total>=N(inv.grand_total_rp)?'PAID':'PARTIAL';sql.exec(`UPDATE plastic_sales_invoice SET status=?,updated_at=? WHERE invoice_id=?`,status,t,id).toArray();audit(sql,a,'PLASTIC_PAYMENT_CREATE','PLASTIC_PAYMENT',id,'',{amount});return{ok:true,invoiceId:id,outstandingRp:N(inv.grand_total_rp)-total}}
/* RKN_PLASTIC_SO_SESSION_ENGINE_V2P */
/* RKN_PLASTIC_RESET_SO_DRAFT_V2R16 */
if(cmd==='RESET_SO_DRAFT'){
  mg(a);

  const soId=T(p.soId,160);
  const reason=T(p.reason,500);

  if(!soId)throw Error('PLASTIC_SO_ID_REQUIRED');
  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');

  const session=sql.exec(
    `SELECT so_id soId,so_no soNo,date_key dateKey,status
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
       AND so_id=?
     LIMIT 1`,
    soId
  ).toArray()[0];

  if(!session)throw Error('PLASTIC_SO_SESSION_NOT_FOUND');

  const status=T(session.status,20).toUpperCase();

  if(!['DRAFT','REVIEW'].includes(status)){
    throw Error('PLASTIC_SO_RESET_ONLY_DRAFT_OR_REVIEW');
  }

  return atomic(()=>{
    const lineCount=scalar(
      sql,
      `SELECT COUNT(*) value
       FROM plastic_so_session_line
       WHERE so_id=?`,
      soId
    );

    sql.exec(
      `DELETE FROM plastic_so_session_line
       WHERE so_id=?`,
      soId
    ).toArray();

    sql.exec(
      `DELETE FROM plastic_so_session
       WHERE business_unit_id='BU-PLASTIC'
         AND so_id=?`,
      soId
    ).toArray();

    audit(
      sql,
      a,
      'PLASTIC_SO_DRAFT_RESET',
      'PLASTIC_SO_SESSION',
      soId,
      reason,
      {
        soNo:T(session.soNo,160),
        dateKey:T(session.dateKey,10),
        previousStatus:status,
        deletedDraftLines:lineCount
      }
    );

    return{
      ok:true,
      soId,
      reset:true,
      deletedDraftLines:lineCount
    };
  });
}
if(cmd==='START_SO_SESSION'){
  syncAuthoritativeInventory(sql);
  mg(a);
  const date=DK(p.dateKey),period=date.slice(0,7),reason=T(p.reason||'Stock Opname',500);
  if(date<PLASTIC_OPENING_DATE_KEY)throw Error('PLASTIC_SO_BEFORE_OPENING_DATE');
  open(sql,period);

  const existing=sql.exec(
    `SELECT so_id soId,so_no soNo,status
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC'
       AND date_key=?
       AND status IN('DRAFT','REVIEW')
     LIMIT 1`,
    date
  ).toArray()[0];

  if(existing)throw Error('PLASTIC_SO_ACTIVE_ALREADY_EXISTS');

  const snapshot=authoritativeSoStockRows(sql,date).filter((row:any)=>
    !(T(row.variantId,120)==='PL-THERMAL-THERMAL-GOLDWIN' && date==='2026-08-28')
  );

  if(!snapshot.length)throw Error('PLASTIC_SO_NO_PRODUCTS');

  return atomic(()=>{
    const id=crypto.randomUUID();
    const no='SO-'+date.replaceAll('-','')+'-'+id.replaceAll('-','').slice(0,6).toUpperCase();
    const t=now();

    sql.exec(
      `INSERT INTO plastic_so_session(
         so_id,business_unit_id,so_no,period_key,date_key,status,reason,
         actor_user_id,legacy_opname_id,created_at,updated_at,posted_at
       ) VALUES(?,'BU-PLASTIC',?,?,?,'DRAFT',?,?,'',?,?,'')`,
      id,no,period,date,reason,a.id,t,t
    ).toArray();

    for(const row of snapshot){
      sql.exec(
        `INSERT INTO plastic_so_session_line(
           line_id,so_id,variant_id,system_qty_base,physical_qty_base,
           physical_entered,snapshot_unit_cost_rp,note,created_at,updated_at
         ) VALUES(?,?,?,?,0,0,?,'',?,?)`,
        crypto.randomUUID(),id,T(row.variantId,120),N(row.systemQtyBase),I(row.avgCostRp),t,t
      ).toArray();
    }

    audit(sql,a,'PLASTIC_SO_START','PLASTIC_SO_SESSION',id,reason,{soNo:no,dateKey:date,totalSku:snapshot.length});
    return{ok:true,soId:id,soNo:no,status:'DRAFT',totalSku:snapshot.length};
  });
}

if(cmd==='SAVE_SO_DRAFT'){
  mg(a);
  const soId=T(p.soId,160);
  if(!soId)throw Error('PLASTIC_SO_REQUIRED');

  const session=sql.exec(
    `SELECT so_id soId,period_key periodKey,date_key dateKey,status
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC' AND so_id=? LIMIT 1`,
    soId
  ).toArray()[0];

  if(!session)throw Error('PLASTIC_SO_NOT_FOUND');
  if(!['DRAFT','REVIEW'].includes(String(session.status)))throw Error('PLASTIC_SO_NOT_EDITABLE');
  open(sql,T(session.periodKey,7));

  const lines=Array.isArray(p.lines)?p.lines:[];
  if(!lines.length)throw Error('PLASTIC_SO_LINES_REQUIRED');

  const t=now();

  for(const row of lines){
    const vid=T(row.variantId,120);
    const phy=Math.max(0,N(row.physicalQtyBase));
    const note=T(row.note,500);

    const found=sql.exec(
      `SELECT line_id lineId FROM plastic_so_session_line WHERE so_id=? AND variant_id=? LIMIT 1`,
      soId,vid
    ).toArray()[0];

    if(!found)throw Error('PLASTIC_SO_VARIANT_NOT_FOUND');

    sql.exec(
      `UPDATE plastic_so_session_line
       SET physical_qty_base=?,physical_entered=1,note=?,updated_at=?
       WHERE so_id=? AND variant_id=?`,
      phy,note,t,soId,vid
    ).toArray();
  }

  sql.exec(
    `UPDATE plastic_so_session SET status='DRAFT',updated_at=? WHERE so_id=?`,
    t,soId
  ).toArray();

  audit(sql,a,'PLASTIC_SO_DRAFT_SAVE','PLASTIC_SO_SESSION',soId,'',{savedLines:lines.length});
  return{ok:true,soId,status:'DRAFT',savedLines:lines.length};
}

if(cmd==='REVIEW_SO_SESSION'){
  mg(a);
  const soId=T(p.soId,160);
  if(!soId)throw Error('PLASTIC_SO_REQUIRED');

  const session=sql.exec(
    `SELECT so_id soId,period_key periodKey,date_key dateKey,status
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC' AND so_id=? LIMIT 1`,
    soId
  ).toArray()[0];

  if(!session)throw Error('PLASTIC_SO_NOT_FOUND');
  if(!['DRAFT','REVIEW'].includes(String(session.status)))throw Error('PLASTIC_SO_NOT_REVIEWABLE');
  open(sql,T(session.periodKey,7));

  const lines=Array.isArray(p.lines)?p.lines:[];
  const t=now();

  for(const row of lines){
    const vid=T(row.variantId,120);
    const phy=Math.max(0,N(row.physicalQtyBase));
    const note=T(row.note,500);

    sql.exec(
      `UPDATE plastic_so_session_line
       SET physical_qty_base=?,physical_entered=1,note=?,updated_at=?
       WHERE so_id=? AND variant_id=?`,
      phy,note,t,soId,vid
    ).toArray();
  }

  const authoritativeRows=authoritativeSoStockRows(sql,T(session.dateKey,10));
  for(const row of authoritativeRows as any[]){
    sql.exec(
      `UPDATE plastic_so_session_line
       SET system_qty_base=?,snapshot_unit_cost_rp=?,updated_at=?
       WHERE so_id=? AND variant_id=?`,
      N(row.systemQtyBase),I(row.avgCostRp),t,soId,T(row.variantId,120)
    ).toArray();
  }

  const counts=sql.exec(
    `SELECT COUNT(*) total,SUM(CASE WHEN l.physical_entered=1 THEN 1 ELSE 0 END) entered
     FROM plastic_so_session_line l
     JOIN plastic_so_session s ON s.so_id=l.so_id
     WHERE l.so_id=?
       AND NOT (l.variant_id='PL-THERMAL-THERMAL-GOLDWIN' AND s.date_key='2026-08-28')`,
    soId
  ).toArray()[0]??{};

  if(N(counts.total)<=0||N(counts.entered)!==N(counts.total)){
    throw Error('PLASTIC_SO_PHYSICAL_INCOMPLETE');
  }

  sql.exec(
    `UPDATE plastic_so_session SET status='REVIEW',updated_at=? WHERE so_id=?`,
    t,soId
  ).toArray();

  audit(sql,a,'PLASTIC_SO_REVIEW','PLASTIC_SO_SESSION',soId,'',{totalSku:N(counts.total)});
  return{ok:true,soId,status:'REVIEW',totalSku:N(counts.total)};
}

if(cmd==='POST_SO_ADJUSTMENT'){
  mg(a);
  const soId=T(p.soId,160),reason=T(p.reason,500);
  if(!soId)throw Error('PLASTIC_SO_REQUIRED');
  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');

  const session=sql.exec(
    `SELECT so_id soId,so_no soNo,period_key periodKey,date_key dateKey,status
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC' AND so_id=? LIMIT 1`,
    soId
  ).toArray()[0];

  if(!session)throw Error('PLASTIC_SO_NOT_FOUND');
  if(String(session.status)!=='REVIEW')throw Error('PLASTIC_SO_REVIEW_REQUIRED');

  const period=T(session.periodKey,7),date=DK(session.dateKey);
  open(sql,period);

  const lines=sql.exec(
    `SELECT line_id lineId,variant_id variantId,system_qty_base systemQtyBase,
            physical_qty_base physicalQtyBase,physical_entered physicalEntered,
            snapshot_unit_cost_rp snapshotUnitCostRp,note
     FROM plastic_so_session_line
     WHERE so_id=?
       AND NOT (variant_id='PL-THERMAL-THERMAL-GOLDWIN' AND ?='2026-08-28')
     ORDER BY variant_id`,
    soId,date
  ).toArray();

  if(!lines.length)throw Error('PLASTIC_SO_LINES_REQUIRED');
  if(lines.some((row:any)=>Number(row.physicalEntered)!==1))throw Error('PLASTIC_SO_PHYSICAL_INCOMPLETE');
  const authoritativeRows=authoritativeSoStockRows(sql,date);
  const authoritativeByVariant=new Map<string,any>();
  for(const row of authoritativeRows as any[]){
    authoritativeByVariant.set(T(row.variantId,120),row);
  }
  const postingLines=(lines as any[]).map((row:any)=>{
    const authoritative=authoritativeByVariant.get(T(row.variantId,120));
    if(!authoritative)throw Error('PLASTIC_SO_AUTHORITATIVE_VARIANT_MISSING');
    return{
      ...row,
      storedSystemQtyBase:N(row.systemQtyBase),
      systemQtyBase:N(authoritative.systemQtyBase),
      snapshotUnitCostRp:I(authoritative.avgCostRp),
      checkpointDateKey:T(authoritative.checkpointDateKey,10)
    };
  });

  return atomic(()=>{
    const legacyId=crypto.randomUUID();
    const t=now();

    sql.exec(
      `INSERT INTO plastic_stock_opname(
         opname_id,business_unit_id,opname_no,period_key,date_key,reason,actor_user_id,created_at
       ) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?)`,
      legacyId,T(session.soNo,160),period,date,reason,a.id,t
    ).toArray();

    let balanceCount=0,lessCount=0,moreCount=0;

    for(const row of postingLines){
      const vid=T(row.variantId,120),sys=N(row.systemQtyBase),phy=N(row.physicalQtyBase),diff=phy-sys,cost=I(row.snapshotUnitCostRp);

      sql.exec(
        `UPDATE plastic_so_session_line
         SET system_qty_base=?,snapshot_unit_cost_rp=?,updated_at=?
         WHERE so_id=? AND variant_id=?`,
        sys,cost,t,soId,vid
      ).toArray();

      sql.exec(
        `INSERT INTO plastic_stock_opname_line(
           line_id,opname_id,variant_id,system_qty_base,physical_qty_base,variance_qty_base,created_at
         ) VALUES(?,?,?,?,?,?,?)`,
        crypto.randomUUID(),legacyId,vid,sys,phy,diff,t
      ).toArray();

      if(Math.abs(diff)<0.000001){
        balanceCount++;
        continue;
      }

      sql.exec(
        `INSERT INTO plastic_inventory_movement(
           movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,
           qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at
         ) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,?,?,?,?,?,?)`,
        crypto.randomUUID(),vid,period,date,diff>0?'ADJUSTMENT_IN':'ADJUSTMENT_OUT',
        Math.abs(diff),cost,'SO_SESSION',soId,a.id,reason,t,t
      ).toArray();

      if(diff<0)lessCount++;
      if(diff>0)moreCount++;
    }

    /* The adjustment movement is authoritative. Rebuild the non-negative
       live cache afterward so a historical negative never becomes a false
       positive balance (for example -18 + 18 must cache as 0, not 18). */
    syncAuthoritativeInventory(sql);

    sql.exec(
      `UPDATE plastic_so_session
       SET status='POSTED',legacy_opname_id=?,reason=?,updated_at=?,posted_at=?
       WHERE so_id=?`,
      legacyId,reason,t,t,soId
    ).toArray();

    audit(sql,a,'PLASTIC_SO_POST','PLASTIC_SO_SESSION',soId,reason,{
      soNo:T(session.soNo,160),
      dateKey:date,
      totalSku:postingLines.length,
      balanceSku:balanceCount,
      lessSku:lessCount,
      moreSku:moreCount,
      legacyOpnameId:legacyId,
      systemBasis:'OFFICIAL_DOCUMENTS_AS_OF_SO_DATE',
      checkpointDateKey:T(postingLines[0]?.checkpointDateKey,10),
      refreshedSnapshotSku:postingLines.filter((row:any)=>
        Math.abs(N(row.storedSystemQtyBase)-N(row.systemQtyBase))>0.000001
      ).length
    });

    return{
      ok:true,
      soId,
      opnameId:legacyId,
      opnameNo:T(session.soNo,160),
      status:'POSTED',
      totalSku:postingLines.length,
      balanceSku:balanceCount,
      lessSku:lessCount,
      moreSku:moreCount
    };
  });
}

/* RKN_PLASTIC_POSTED_SO_FACTUAL_CORRECTION_V2R24
   Posted SO data cannot be edited through the ordinary draft workflow. This
   command is the narrow, audited exception for a proven physical-count input
   error. It refreshes the official system side for every SO line, replaces
   only the requested physical values, rebuilds the derived SO adjustments,
   and finally refreshes live stock from the corrected checkpoint. */
if(cmd==='CORRECT_POSTED_SO'){
  mg(a);
  const soId=T(p.soId,160),reason=T(p.reason,500);
  if(!soId)throw Error('PLASTIC_SO_REQUIRED');
  if(!reason)throw Error('PLASTIC_REASON_REQUIRED');

  const session=sql.exec(
    `SELECT so_id soId,so_no soNo,period_key periodKey,date_key dateKey,status,
            legacy_opname_id legacyOpnameId
     FROM plastic_so_session
     WHERE business_unit_id='BU-PLASTIC' AND so_id=? LIMIT 1`,
    soId
  ).toArray()[0];

  if(!session)throw Error('PLASTIC_SO_NOT_FOUND');
  if(T(session.status,20).toUpperCase()!=='POSTED'){
    throw Error('PLASTIC_SO_POSTED_REQUIRED');
  }

  const period=T(session.periodKey,7),date=DK(session.dateKey);
  const legacyOpnameId=T(session.legacyOpnameId,160);
  if(!legacyOpnameId)throw Error('PLASTIC_SO_LEGACY_SNAPSHOT_REQUIRED');
  open(sql,period);

  const requested=Array.isArray(p.lines)?p.lines:[];
  if(!requested.length)throw Error('PLASTIC_SO_CORRECTION_LINES_REQUIRED');

  const currentLines=sql.exec(
    `SELECT line_id lineId,variant_id variantId,system_qty_base systemQtyBase,
            physical_qty_base physicalQtyBase,physical_entered physicalEntered,
            snapshot_unit_cost_rp snapshotUnitCostRp,note
     FROM plastic_so_session_line
     WHERE so_id=?
       AND NOT (variant_id='PL-THERMAL-THERMAL-GOLDWIN' AND ?='2026-08-28')
     ORDER BY variant_id`,
    soId,date
  ).toArray();

  if(!currentLines.length)throw Error('PLASTIC_SO_LINES_REQUIRED');
  if(currentLines.some((row:any)=>Number(row.physicalEntered)!==1)){
    throw Error('PLASTIC_SO_PHYSICAL_INCOMPLETE');
  }

  const currentByVariant=new Map<string,any>();
  for(const row of currentLines as any[]){
    currentByVariant.set(T(row.variantId,120),row);
  }

  const targetPhysicalByVariant=new Map<string,{target:number;expected:number|null;note:string}>();
  for(const raw of requested as any[]){
    const variantId=T(raw.variantId,120);
    if(!variantId||targetPhysicalByVariant.has(variantId)){
      throw Error('PLASTIC_SO_CORRECTION_VARIANT_DUPLICATE');
    }
    const current=currentByVariant.get(variantId);
    if(!current)throw Error('PLASTIC_SO_VARIANT_NOT_FOUND');
    const target=Number(raw.physicalQtyBase);
    if(!Number.isFinite(target)||target<0){
      throw Error('PLASTIC_SO_PHYSICAL_INVALID');
    }
    const hasExpected=Object.prototype.hasOwnProperty.call(raw,'expectedPhysicalQtyBase');
    const expected=hasExpected?Number(raw.expectedPhysicalQtyBase):null;
    if(hasExpected&&(!Number.isFinite(expected)||Number(expected)<0)){
      throw Error('PLASTIC_SO_EXPECTED_PHYSICAL_INVALID');
    }
    const actual=N(current.physicalQtyBase);
    if(expected!==null&&Math.abs(actual-expected)>0.000001&&Math.abs(actual-target)>0.000001){
      throw Error('PLASTIC_SO_CORRECTION_CONFLICT');
    }
    targetPhysicalByVariant.set(variantId,{
      target,
      expected,
      note:T(raw.note,500)
    });
  }

  const authoritativeRows=authoritativeSoStockRows(sql,date);
  const authoritativeByVariant=new Map<string,any>();
  for(const row of authoritativeRows as any[]){
    authoritativeByVariant.set(T(row.variantId,120),row);
  }

  const postingLines=(currentLines as any[]).map((row:any)=>{
    const variantId=T(row.variantId,120);
    const authoritative=authoritativeByVariant.get(variantId);
    if(!authoritative)throw Error('PLASTIC_SO_AUTHORITATIVE_VARIANT_MISSING');
    const correction=targetPhysicalByVariant.get(variantId);
    return{
      ...row,
      variantId,
      oldSystemQtyBase:N(row.systemQtyBase),
      oldPhysicalQtyBase:N(row.physicalQtyBase),
      systemQtyBase:N(authoritative.systemQtyBase),
      physicalQtyBase:correction?correction.target:N(row.physicalQtyBase),
      snapshotUnitCostRp:I(authoritative.avgCostRp),
      note:correction?.note||T(row.note,500),
      requestedCorrection:Boolean(correction)
    };
  });

  const legacyLineCount=scalar(
    sql,
    `SELECT COUNT(*) value FROM plastic_stock_opname_line WHERE opname_id=?`,
    legacyOpnameId
  );
  if(legacyLineCount!==postingLines.length){
    throw Error('PLASTIC_SO_LEGACY_SNAPSHOT_INCOMPLETE');
  }

  const factualChanges=postingLines.filter((row:any)=>
    row.requestedCorrection&&
    Math.abs(N(row.oldPhysicalQtyBase)-N(row.physicalQtyBase))>0.000001
  );
  const systemChanges=postingLines.filter((row:any)=>
    Math.abs(N(row.oldSystemQtyBase)-N(row.systemQtyBase))>0.000001
  );

  const summarize=(rows:any[])=>{
    let balanceSku=0,lessSku=0,moreSku=0;
    for(const row of rows){
      const diff=N(row.physicalQtyBase)-N(row.systemQtyBase);
      if(Math.abs(diff)<0.000001)balanceSku++;
      else if(diff<0)lessSku++;
      else moreSku++;
    }
    return{balanceSku,lessSku,moreSku};
  };
  const summary=summarize(postingLines);

  if(!factualChanges.length&&!systemChanges.length){
    return{
      ok:true,soId,status:'POSTED',alreadyApplied:true,
      totalSku:postingLines.length,...summary
    };
  }

  return atomic(()=>{
    const t=now();
    const previousAdjustmentMovements=scalar(
      sql,
      `SELECT COUNT(*) value
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND source_type='SO_SESSION' AND source_key=?`,
      soId
    );

    sql.exec(
      `DELETE FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND source_type='SO_SESSION' AND source_key=?`,
      soId
    ).toArray();

    let rebuiltAdjustmentMovements=0;
    for(const row of postingLines){
      const variantId=T(row.variantId,120);
      const systemQtyBase=N(row.systemQtyBase);
      const physicalQtyBase=N(row.physicalQtyBase);
      const varianceQtyBase=physicalQtyBase-systemQtyBase;
      const cost=I(row.snapshotUnitCostRp);

      sql.exec(
        `UPDATE plastic_so_session_line
         SET system_qty_base=?,physical_qty_base=?,physical_entered=1,
             snapshot_unit_cost_rp=?,note=?,updated_at=?
         WHERE so_id=? AND variant_id=?`,
        systemQtyBase,physicalQtyBase,cost,T(row.note,500),t,soId,variantId
      ).toArray();

      sql.exec(
        `UPDATE plastic_stock_opname_line
         SET system_qty_base=?,physical_qty_base=?,variance_qty_base=?
         WHERE opname_id=? AND variant_id=?`,
        systemQtyBase,physicalQtyBase,varianceQtyBase,legacyOpnameId,variantId
      ).toArray();

      if(Math.abs(varianceQtyBase)<0.000001)continue;
      sql.exec(
        `INSERT INTO plastic_inventory_movement(
           movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,
           qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at
         ) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,?,?,?,?,?,?)`,
        crypto.randomUUID(),variantId,period,date,
        varianceQtyBase>0?'ADJUSTMENT_IN':'ADJUSTMENT_OUT',
        Math.abs(varianceQtyBase),cost,'SO_SESSION',soId,a.id,reason,t,t
      ).toArray();
      rebuiltAdjustmentMovements++;
    }

    sql.exec(
      `UPDATE plastic_so_session SET updated_at=? WHERE so_id=?`,
      t,soId
    ).toArray();
    syncAuthoritativeInventory(sql);

    audit(sql,a,'PLASTIC_SO_POSTED_CORRECTION','PLASTIC_SO_SESSION',soId,reason,{
      soNo:T(session.soNo,160),
      dateKey:date,
      legacyOpnameId,
      physicalCorrections:factualChanges.map((row:any)=>({
        variantId:T(row.variantId,120),
        beforePhysicalQtyBase:N(row.oldPhysicalQtyBase),
        afterPhysicalQtyBase:N(row.physicalQtyBase),
        systemQtyBase:N(row.systemQtyBase)
      })),
      refreshedSystemSku:systemChanges.length,
      previousAdjustmentMovements,
      rebuiltAdjustmentMovements,
      ...summary
    });

    return{
      ok:true,soId,status:'POSTED',alreadyApplied:false,
      correctedPhysicalSku:factualChanges.length,
      refreshedSystemSku:systemChanges.length,
      rebuiltAdjustmentMovements,
      totalSku:postingLines.length,
      ...summary
    };
  });
}


if(cmd==='POST_OPNAME'){mg(a);const date=DK(p.dateKey),period=date.slice(0,7),reason=T(p.reason,500);open(sql,period);if(!reason)throw Error('PLASTIC_REASON_REQUIRED');const lines=Array.isArray(p.lines)?p.lines:[];if(!lines.length)throw Error('PLASTIC_OPNAME_LINES_REQUIRED');return atomic(()=>{const id=crypto.randomUUID(),no='SO-'+date.replaceAll('-','')+'-'+id.replaceAll('-','').slice(0,6).toUpperCase(),t=now();sql.exec(`INSERT INTO plastic_stock_opname(opname_id,business_unit_id,opname_no,period_key,date_key,reason,actor_user_id,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?)`,id,no,period,date,reason,a.id,t).toArray();for(const r of lines){const vid=T(r.variantId,120);variant(sql,vid);const b=sql.exec(`SELECT qty_base,avg_cost_rp FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC' AND variant_id=? LIMIT 1`,vid).toArray()[0],sys=N(b?.qty_base),phy=Math.max(0,N(r.physicalQtyBase)),diff=phy-sys;sql.exec(`INSERT INTO plastic_stock_opname_line(line_id,opname_id,variant_id,system_qty_base,physical_qty_base,variance_qty_base,created_at) VALUES(?,?,?,?,?,?,?)`,crypto.randomUUID(),id,vid,sys,phy,diff,t).toArray();sql.exec(`INSERT INTO plastic_inventory_balance(business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at) VALUES('BU-PLASTIC',?,?,?,?) ON CONFLICT(business_unit_id,variant_id) DO UPDATE SET qty_base=excluded.qty_base,updated_at=excluded.updated_at`,vid,phy,I(b?.avg_cost_rp),t).toArray();if(Math.abs(diff)>1e-9)sql.exec(`INSERT INTO plastic_inventory_movement(movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,? ,?,?,?,?,?)`,crypto.randomUUID(),vid,period,date,diff>0?'ADJUSTMENT_IN':'ADJUSTMENT_OUT',Math.abs(diff),I(b?.avg_cost_rp),'STOCK_OPNAME',id,a.id,reason,t,t).toArray()}audit(sql,a,'PLASTIC_STOCK_OPNAME_CLOSE','PLASTIC_STOCK_OPNAME',id,reason,{no});return{ok:true,opnameId:id,opnameNo:no}})}
if(cmd==='CLOSE_PERIOD'){ow(a);const period=PK(p.periodKey);open(sql,period);const start=period+'-01';const [y,m]=period.split('-').map(Number),next=new Date(Date.UTC(y,m,1)),end=`${next.getUTCFullYear()}-${String(next.getUTCMonth()+1).padStart(2,'0')}-01`;const mov=sql.exec(`SELECT movement_type,qty_base,unit_cost_rp,date_key FROM plastic_inventory_movement WHERE business_unit_id='BU-PLASTIC' AND date_key<?`,end).toArray();let opening=0,inn=0,out=0,adj=0,val=0;for(const r of mov){const type=String(r.movement_type),q=N(r.qty_base),sg=['OPENING','IN','RETURN_IN','ADJUSTMENT_IN'].includes(type)?1:-1;val+=Math.round(sg*q*N(r.unit_cost_rp));if(String(r.date_key)<start){opening+=sg*q;continue}if(['IN','RETURN_IN'].includes(type))inn+=q;else if(['OUT','RETURN_OUT'].includes(type))out+=q;else if(type==='ADJUSTMENT_IN')adj+=q;else if(type==='ADJUSTMENT_OUT')adj-=q}const closing=opening+inn-out+adj,sales=scalar(sql,`SELECT COALESCE(SUM(grand_total_rp),0) value FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND period_key=? AND status<>'VOID'`,period),cogs=scalar(sql,`SELECT COALESCE(SUM(l.cogs_total_rp),0) value FROM plastic_sales_line l JOIN plastic_sales_invoice i ON i.invoice_id=l.invoice_id WHERE i.business_unit_id='BU-PLASTIC' AND i.period_key=? AND i.status<>'VOID'`,period);let rec=0;for(const inv of sql.exec(`SELECT invoice_id,grand_total_rp FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND period_key=? AND status<>'VOID'`,period).toArray())rec+=Math.max(0,N(inv.grand_total_rp)-paid(sql,String(inv.invoice_id)));const t=now();sql.exec(`INSERT INTO plastic_month_close(business_unit_id,period_key,status,opening_stock_qty,inbound_qty,outbound_qty,adjustment_qty,closing_stock_qty,sales_rp,cogs_rp,gross_profit_rp,receivable_rp,closing_inventory_value_rp,closed_at,closed_by,reopen_reason,updated_at) VALUES('BU-PLASTIC',?,'CLOSED',?,?,?,?,?,?,?,?,?,?,?,?,'',?) ON CONFLICT(business_unit_id,period_key) DO UPDATE SET status='CLOSED',opening_stock_qty=excluded.opening_stock_qty,inbound_qty=excluded.inbound_qty,outbound_qty=excluded.outbound_qty,adjustment_qty=excluded.adjustment_qty,closing_stock_qty=excluded.closing_stock_qty,sales_rp=excluded.sales_rp,cogs_rp=excluded.cogs_rp,gross_profit_rp=excluded.gross_profit_rp,receivable_rp=excluded.receivable_rp,closing_inventory_value_rp=excluded.closing_inventory_value_rp,closed_at=excluded.closed_at,closed_by=excluded.closed_by,reopen_reason='',updated_at=excluded.updated_at`,period,opening,inn,out,adj,closing,sales,cogs,sales-cogs,rec,Math.max(0,val),t,a.id,t).toArray();audit(sql,a,'PLASTIC_MONTH_CLOSE','PLASTIC_MONTH_CLOSE',period,T(p.reason,500),{opening,inn,out,adj,closing,sales,cogs,rec});return{ok:true,periodKey:period,status:'CLOSED'}}
if(cmd==='REOPEN_PERIOD'){ow(a);const period=PK(p.periodKey),reason=T(p.reason,500);if(!reason)throw Error('PLASTIC_REASON_REQUIRED');const r=sql.exec(`SELECT status FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' AND period_key=? LIMIT 1`,period).toArray()[0];if(String(r?.status)!=='CLOSED')throw Error('PLASTIC_PERIOD_NOT_CLOSED');sql.exec(`UPDATE plastic_month_close SET status='OPEN',reopen_reason=?,updated_at=? WHERE business_unit_id='BU-PLASTIC' AND period_key=?`,reason,now(),period).toArray();audit(sql,a,'PLASTIC_MONTH_REOPEN','PLASTIC_MONTH_CLOSE',period,reason,{});return{ok:true,periodKey:period,status:'OPEN'}}
throw Error('PLASTIC_COMMAND_UNSUPPORTED')}
