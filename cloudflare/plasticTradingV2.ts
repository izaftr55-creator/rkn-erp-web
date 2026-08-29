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

export function initPlasticTradingV2(storage:any){const sql:Sql=storage.sql;sql.exec(PLASTIC_SCHEMA_V2).toArray();const slCols=sql.exec(`PRAGMA table_info(plastic_sales_line)`).toArray().map((r:any)=>String(r.name));if(!slCols.includes('qty_input'))sql.exec(`ALTER TABLE plastic_sales_line ADD COLUMN qty_input REAL NOT NULL DEFAULT 1`).toArray();if(!slCols.includes('input_unit'))sql.exec(`ALTER TABLE plastic_sales_line ADD COLUMN input_unit TEXT NOT NULL DEFAULT 'ROLL'`).toArray();const pvCols=sql.exec(`PRAGMA table_info(plastic_product_variant)`).toArray().map((r:any)=>String(r.name));if(!pvCols.includes('mid_unit'))sql.exec(`ALTER TABLE plastic_product_variant ADD COLUMN mid_unit TEXT NOT NULL DEFAULT ''`).toArray();if(!pvCols.includes('units_per_mid'))sql.exec(`ALTER TABLE plastic_product_variant ADD COLUMN units_per_mid INTEGER NOT NULL DEFAULT 1`).toArray();if(!pvCols.includes('default_sell_price_mid_rp'))sql.exec(`ALTER TABLE plastic_product_variant ADD COLUMN default_sell_price_mid_rp INTEGER NOT NULL DEFAULT 0`).toArray();sql.exec(`
/* RKN_PLASTIC_MASTER_GOOGLE_SHEET_SEED_V2E */
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HITAM-15X25','BU-PLASTIC','Polymailer','HITAM','Hitam','15x25','','ROLL','','BALL',1,100,0,17000,0,1700000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HITAM-17X30','BU-PLASTIC','Polymailer','HITAM','Hitam','17x30','','ROLL','','BALL',1,80,0,19000,0,1520000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HITAM-20X30','BU-PLASTIC','Polymailer','HITAM','Hitam','20x30','','ROLL','','BALL',1,80,0,22000,0,1760000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HITAM-25X35','BU-PLASTIC','Polymailer','HITAM','Hitam','25x35','','ROLL','','BALL',1,50,0,27000,0,1350000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PINK-15X25','BU-PLASTIC','Polymailer','WARNA','Pink','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PINK-17X30','BU-PLASTIC','Polymailer','WARNA','Pink','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PINK-20X30','BU-PLASTIC','Polymailer','WARNA','Pink','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PINK-25X35','BU-PLASTIC','Polymailer','WARNA','Pink','25x35','','ROLL','','BALL',1,50,0,39000,0,1950000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-KUNING-15X25','BU-PLASTIC','Polymailer','WARNA','Kuning','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-KUNING-17X30','BU-PLASTIC','Polymailer','WARNA','Kuning','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-KUNING-20X30','BU-PLASTIC','Polymailer','WARNA','Kuning','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-KUNING-25X35','BU-PLASTIC','Polymailer','WARNA','Kuning','25x35','','ROLL','','BALL',1,50,0,39000,0,1950000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-ORANGE-15X25','BU-PLASTIC','Polymailer','WARNA','Orange','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-ORANGE-17X30','BU-PLASTIC','Polymailer','WARNA','Orange','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-ORANGE-20X30','BU-PLASTIC','Polymailer','WARNA','Orange','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-ORANGE-25X35','BU-PLASTIC','Polymailer','WARNA','Orange','25x35','','ROLL','','BALL',1,50,0,39000,0,1950000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-BIRU-15X25','BU-PLASTIC','Polymailer','WARNA','Biru','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-BIRU-17X30','BU-PLASTIC','Polymailer','WARNA','Biru','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-BIRU-20X30','BU-PLASTIC','Polymailer','WARNA','Biru','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-BIRU-25X35','BU-PLASTIC','Polymailer','WARNA','Biru','25x35','','ROLL','','BALL',1,50,0,39000,0,1950000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HIJAU-15X25','BU-PLASTIC','Polymailer','WARNA','Hijau','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HIJAU-17X30','BU-PLASTIC','Polymailer','WARNA','Hijau','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HIJAU-20X30','BU-PLASTIC','Polymailer','WARNA','Hijau','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-HIJAU-25X35','BU-PLASTIC','Polymailer','WARNA','Hijau','25x35','','ROLL','','BALL',1,50,0,39000,0,1950000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-A-15X25','BU-PLASTIC','Polymailer','WARNA','Putih A','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-A-17X30','BU-PLASTIC','Polymailer','WARNA','Putih A','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-A-20X30','BU-PLASTIC','Polymailer','WARNA','Putih A','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-A-25X35','BU-PLASTIC','Polymailer','WARNA','Putih A','25x35','','ROLL','','BALL',1,50,0,39000,0,1950000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-UNGU-15X25','BU-PLASTIC','Polymailer','WARNA','Ungu','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-UNGU-17X30','BU-PLASTIC','Polymailer','WARNA','Ungu','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-UNGU-20X30','BU-PLASTIC','Polymailer','WARNA','Ungu','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-UNGU-25X35','BU-PLASTIC','Polymailer','WARNA','Ungu','25x35','','ROLL','','BALL',1,50,0,39000,0,1950000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-TOSCA-15X25','BU-PLASTIC','Polymailer','WARNA','Tosca','15x25','','ROLL','','BALL',1,100,0,18500,0,1850000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-TOSCA-17X30','BU-PLASTIC','Polymailer','WARNA','Tosca','17x30','','ROLL','','BALL',1,50,0,23500,0,1175000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-TOSCA-20X30','BU-PLASTIC','Polymailer','WARNA','Tosca','20x30','','ROLL','','BALL',1,50,0,26000,0,1300000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-TOSCA-25X35','BU-PLASTIC','Polymailer','WARNA','Tosca','25x35','','ROLL','','BALL',1,50,0,39000,0,1950000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-B-15X25','BU-PLASTIC','Polymailer','PUTIH B','Putih B','15x25','','ROLL','','BALL',1,100,0,15500,0,1550000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-B-17X30','BU-PLASTIC','Polymailer','PUTIH B','Putih B','17x30','','ROLL','','BALL',1,50,0,19500,0,975000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-POLY-PUTIH-B-20X30','BU-PLASTIC','Polymailer','PUTIH B','Putih B','20x30','','ROLL','','BALL',1,50,0,22500,0,1125000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-THERMAL-THERMAL-GOLDWIN','BU-PLASTIC','Thermal Goldwin','THERMAL','','100x150','','LEMBAR','STACK','DUS',500,10000,0,0,42000,840000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK','BU-PLASTIC','Thermal Dus Panjang (Tanpa Merk)','THERMAL','','100x150','','LEMBAR','STACK','DUS',500,10000,0,0,40000,800000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO plastic_product_variant(variant_id,business_unit_id,product_name,category,color,size,grade,base_unit,mid_unit,pack_unit,units_per_mid,units_per_pack,default_buy_price_rp,default_sell_price_base_rp,default_sell_price_mid_rp,default_sell_price_pack_rp,low_stock_base_qty,active,created_at,updated_at) VALUES('PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK','BU-PLASTIC','Thermal Dus Kotak (Tanpa Merk)','THERMAL','','100x150','','LEMBAR','STACK','DUS',500,10000,0,0,39000,780000,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
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

function actor(sql:Sql,idv:any):Actor{const id=T(idv,160);if(!id)throw Error('PLASTIC_ACTOR_REQUIRED');const p=sql.exec(`SELECT active,full_name,primary_role_code FROM erp_user_profile WHERE user_id=? LIMIT 1`,id).toArray()[0];if(!p||Number(p.active)!==1)throw Error('PLASTIC_PROFILE_INACTIVE');const admin=sql.exec(`SELECT 1 FROM user_role ur JOIN role r ON r.id=ur.role_id WHERE ur.user_id=? AND r.code='SYSTEM_ADMIN' LIMIT 1`,id).toArray().length>0;const s=sql.exec(`SELECT access_level FROM user_business_scope WHERE user_id=? AND business_unit_id='BU-PLASTIC' LIMIT 1`,id).toArray()[0];const level=admin?'OWNER':T(s?.access_level,16);if(!admin&&!['VIEW','OPERATE','MANAGE','OWNER'].includes(level))throw Error('PLASTIC_SCOPE_DENIED');return{id,name:T(p.full_name,160),role:T(p.primary_role_code,64),level,admin}}
const op=(a:Actor)=>{if(!a.admin&&!['OPERATE','MANAGE','OWNER'].includes(a.level))throw Error('PLASTIC_WRITE_DENIED')};
const mg=(a:Actor)=>{if(!a.admin&&!['MANAGE','OWNER'].includes(a.level))throw Error('PLASTIC_MANAGE_DENIED')};
const ow=(a:Actor)=>{if(!a.admin&&a.level!=='OWNER')throw Error('PLASTIC_OWNER_DENIED')};
const open=(sql:Sql,p:string)=>{const r=sql.exec(`SELECT status FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' AND period_key=? LIMIT 1`,p).toArray()[0];if(String(r?.status??'OPEN')==='CLOSED')throw Error('PLASTIC_PERIOD_CLOSED')};
const audit=(sql:Sql,a:Actor,action:string,etype:string,eid:string,reason='',details:any={})=>sql.exec(`INSERT INTO audit_log(id,actor_user_id,business_unit_id,action,entity_type,entity_id,reason,details_json,created_at) VALUES(?,?,'BU-PLASTIC',?,?,?,?,?,?)`,crypto.randomUUID(),a.id,action,etype,eid,reason,JSON.stringify(details),now()).toArray();
const variant=(sql:Sql,id:string)=>{const r=sql.exec(`SELECT * FROM plastic_product_variant WHERE business_unit_id='BU-PLASTIC' AND variant_id=? AND active=1 LIMIT 1`,id).toArray()[0];if(!r)throw Error('PLASTIC_VARIANT_NOT_FOUND');return r};
const baseQty=(v:any,q:any,u:any)=>{const qty=N(q);if(!(qty>0))throw Error('PLASTIC_QTY_INVALID');const unit=T(u||v.base_unit,32).toUpperCase(),base=String(v.base_unit).toUpperCase(),mid=String(v.mid_unit||'').toUpperCase(),pack=String(v.pack_unit).toUpperCase();if(unit!==base&&unit!==pack&&(!mid||unit!==mid))throw Error('PLASTIC_UNIT_INVALID');const multiplier=unit===pack?Math.max(1,N(v.units_per_pack,1)):mid&&unit===mid?Math.max(1,N(v.units_per_mid,1)):1;return{qty,unit,multiplier,baseQty:qty*multiplier}}
const paid=(sql:Sql,invoiceId:string)=>scalar(sql,`SELECT COALESCE(SUM(CASE WHEN status='POSTED' THEN amount_rp ELSE 0 END),0) value FROM plastic_payment WHERE business_unit_id='BU-PLASTIC' AND invoice_id=?`,invoiceId);

export function getPlasticTradingViewV2(storage:any,actorId:string,viewV='DASHBOARD',periodV?:string){const sql:Sql=storage.sql;const a=actor(sql,actorId);const period=/^\d{4}-\d{2}$/.test(String(periodV??''))?String(periodV):curPeriod();const view=T(viewV,32).toUpperCase();
if(view==='DASHBOARD'){const sales=scalar(sql,`SELECT COALESCE(SUM(grand_total_rp),0) value FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND period_key=? AND status<>'VOID'`,period);const cogs=scalar(sql,`SELECT COALESCE(SUM(l.cogs_total_rp),0) value FROM plastic_sales_line l JOIN plastic_sales_invoice i ON i.invoice_id=l.invoice_id WHERE i.business_unit_id='BU-PLASTIC' AND i.period_key=? AND i.status<>'VOID'`,period);const rec=scalar(sql,`SELECT COALESCE(SUM(MAX(i.grand_total_rp-COALESCE(p.paid,0),0)),0) value FROM plastic_sales_invoice i LEFT JOIN(SELECT invoice_id,SUM(CASE WHEN status='POSTED' THEN amount_rp ELSE 0 END) paid FROM plastic_payment WHERE business_unit_id='BU-PLASTIC' GROUP BY invoice_id)p ON p.invoice_id=i.invoice_id WHERE i.business_unit_id='BU-PLASTIC' AND i.status<>'VOID'`);const status=sql.exec(`SELECT status FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' AND period_key=? LIMIT 1`,period).toArray()[0]?.status??'OPEN';return{view,periodKey:period,periodStatus:String(status),actor:{fullName:a.name,roleCode:a.role,accessLevel:a.level,isSystemAdmin:a.admin},metrics:{inboundQty:scalar(sql,`SELECT COALESCE(SUM(qty_base),0) value FROM plastic_inventory_movement WHERE business_unit_id='BU-PLASTIC' AND period_key=? AND movement_type IN('OPENING','IN','RETURN_IN','ADJUSTMENT_IN')`,period),outboundQty:scalar(sql,`SELECT COALESCE(SUM(qty_base),0) value FROM plastic_inventory_movement WHERE business_unit_id='BU-PLASTIC' AND period_key=? AND movement_type IN('OUT','RETURN_OUT','ADJUSTMENT_OUT')`,period),stockQty:scalar(sql,`SELECT COALESCE(SUM(qty_base),0) value FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC'`),salesRp:sales,cogsRp:cogs,grossProfitRp:sales-cogs,receivableRp:rec,stockValueRp:scalar(sql,`SELECT COALESCE(SUM(qty_base*avg_cost_rp),0) value FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC'`)},topCustomers:sql.exec(`SELECT COALESCE(c.customer_name,'') customerName,SUM(i.grand_total_rp) salesRp FROM plastic_sales_invoice i LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id WHERE i.business_unit_id='BU-PLASTIC' AND i.period_key=? AND i.status<>'VOID' GROUP BY i.customer_id,c.customer_name ORDER BY salesRp DESC LIMIT 5`,period).toArray()}}
/* RKN_PLASTIC_OPENING_EFFECTIVE_VIEW_V2M */
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
           WHEN m.source_type IN('OPENING_REVISION','OPENING_VOID')
             AND m.movement_type='ADJUSTMENT_IN' THEN m.qty_base
           WHEN m.source_type IN('OPENING_REVISION','OPENING_VOID')
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
             WHEN m.source_type='OPENING_VOID'
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
           m.source_type IN('OPENING_REVISION','OPENING_VOID')
           AND m.movement_type IN('ADJUSTMENT_IN','ADJUSTMENT_OUT')
         )
       )
     GROUP BY
       v.variant_id,v.product_name,v.category,v.color,v.size,v.grade,
       v.base_unit,v.mid_unit,v.pack_unit,v.units_per_mid,v.units_per_pack
     HAVING COALESCE(SUM(
       CASE
         WHEN m.movement_type='OPENING' THEN m.qty_base
         WHEN m.source_type IN('OPENING_REVISION','OPENING_VOID')
           AND m.movement_type='ADJUSTMENT_IN' THEN m.qty_base
         WHEN m.source_type IN('OPENING_REVISION','OPENING_VOID')
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
    return{
      ...r,
      netQtyBase:net,
      status:net<=1e-9?'VOID':'ACTIVE'
    };
  });

  return{view,periodKey:period,actor:a,rows};
}

/* RKN_PLASTIC_THERMAL_RECON_V2M */
if(view==='RECONCILIATION'){
  const target='2026-08-28';

  sql.exec(
    `UPDATE plastic_so_snapshot
     SET variant_id='PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK',
         source_unit='DUS',
         physical_qty_base=30000,
         mapping_status='MAPPED',
         source_ref='SO Thermal 28/08/2026 · Thermal Polos = Dus Panjang'
     WHERE business_unit_id='BU-PLASTIC'
       AND snapshot_date_key=?
       AND line_key='SO2808-THERMAL-POLOS'`,
    target
  ).toArray();

  sql.exec(
    `UPDATE plastic_so_snapshot
     SET variant_id='PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK',
         source_unit='DUS',
         physical_qty_base=90000,
         mapping_status='MAPPED',
         source_ref='SO Thermal 28/08/2026 · Thermal Kotak = Dus Kotak'
     WHERE business_unit_id='BU-PLASTIC'
       AND snapshot_date_key=?
       AND line_key='SO2808-THERMAL-KOTAK'`,
    target
  ).toArray();

  const variants=sql.exec(
    `SELECT
       v.variant_id variantId,
       v.product_name productName,
       v.category,
       v.color,
       v.size,
       v.base_unit baseUnit,
       v.mid_unit midUnit,
       v.pack_unit packUnit,
       v.units_per_mid unitsPerMid,
       v.units_per_pack unitsPerPack,
       COALESCE(s.physical_qty_base,0) physicalQtyBase,
       CASE WHEN s.line_key IS NULL THEN 0 ELSE 1 END snapshotPresent
     FROM plastic_product_variant v
     LEFT JOIN plastic_so_snapshot s
       ON s.business_unit_id=v.business_unit_id
      AND s.variant_id=v.variant_id
      AND s.snapshot_date_key=?
      AND s.mapping_status='MAPPED'
     WHERE v.business_unit_id='BU-PLASTIC'
       AND v.active=1
       AND (v.category<>'THERMAL' OR s.line_key IS NOT NULL)
     ORDER BY v.category,v.color,v.size,v.product_name`,
    target
  ).toArray().map((r:any)=>{
    const sys=scalar(
      sql,
      `SELECT COALESCE(SUM(
         CASE
           WHEN movement_type IN('OPENING','IN','RETURN_IN','ADJUSTMENT_IN')
             THEN qty_base
           ELSE -qty_base
         END
       ),0) value
       FROM plastic_inventory_movement
       WHERE business_unit_id='BU-PLASTIC'
         AND variant_id=?
         AND date_key<=?`,
      String(r.variantId),target
    );

    const phy=N(r.physicalQtyBase);
    const diff=phy-sys;

    return{
      ...r,
      systemQtyBase:sys,
      varianceQtyBase:diff,
      status:Math.abs(diff)<1e-9?'BALANCE':'SELISIH'
    };
  });

  const review=sql.exec(
    `SELECT
       line_key lineKey,
       source_label sourceLabel,
       source_qty sourceQty,
       source_unit sourceUnit,
       mapping_status mappingStatus,
       source_ref sourceRef
     FROM plastic_so_snapshot
     WHERE business_unit_id='BU-PLASTIC'
       AND snapshot_date_key=?
       AND mapping_status='REVIEW'
     ORDER BY line_key`,
    target
  ).toArray();

  const poly=variants.filter((r:any)=>String(r.category)!=='THERMAL');
  const thermal=variants.filter((r:any)=>String(r.category)==='THERMAL');

  const sum=(rows:any[],key:string)=>
    rows.reduce((s:number,r:any)=>s+N(r[key]),0);

  const balanced=variants.filter((r:any)=>r.status==='BALANCE').length;

  return{
    view,
    periodKey:period,
    actor:a,
    targetDateKey:target,
    rows:variants,
    reviewRows:review,
    summary:{
      totalVariants:variants.length,
      balancedVariants:balanced,
      varianceVariants:variants.length-balanced,
      polyPhysicalQtyBase:sum(poly,'physicalQtyBase'),
      polySystemQtyBase:sum(poly,'systemQtyBase'),
      polyVarianceQtyBase:sum(poly,'physicalQtyBase')-sum(poly,'systemQtyBase'),
      thermalPhysicalQtyBase:sum(thermal,'physicalQtyBase'),
      thermalSystemQtyBase:sum(thermal,'systemQtyBase'),
      thermalVarianceQtyBase:sum(thermal,'physicalQtyBase')-sum(thermal,'systemQtyBase'),
      thermalMappingReview:review.length,
      reference:'Rekap SO Polymailer + SO Thermal / 28/08/2026'
    }
  };
}

if(view==='PRODUCTS')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT v.variant_id variantId,v.product_name productName,v.category,v.color,v.size,v.grade,v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,v.units_per_mid unitsPerMid,v.units_per_pack unitsPerPack,v.default_buy_price_rp defaultBuyPriceRp,v.default_sell_price_base_rp defaultSellPriceBaseRp,v.default_sell_price_mid_rp defaultSellPriceMidRp,v.default_sell_price_pack_rp defaultSellPricePackRp,v.low_stock_base_qty lowStockBaseQty,v.active,COALESCE(b.qty_base,0) qtyBase,COALESCE(b.avg_cost_rp,0) avgCostRp FROM plastic_product_variant v LEFT JOIN plastic_inventory_balance b ON b.business_unit_id=v.business_unit_id AND b.variant_id=v.variant_id WHERE v.business_unit_id='BU-PLASTIC' ORDER BY v.active DESC,v.category,v.product_name,v.color,v.size`).toArray()};
if(view==='CUSTOMERS')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT c.customer_id customerId,c.customer_name customerName,c.phone,c.address,c.notes,c.active,COUNT(DISTINCT i.invoice_id) invoiceCount,COALESCE(SUM(i.grand_total_rp),0) totalSalesRp,MAX(i.date_key) lastPurchaseDate FROM plastic_customer c LEFT JOIN plastic_sales_invoice i ON i.customer_id=c.customer_id AND i.status<>'VOID' WHERE c.business_unit_id='BU-PLASTIC' GROUP BY c.customer_id ORDER BY c.active DESC,c.customer_name`).toArray()};
if(view==='INBOUND')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT i.inbound_id inboundId,i.inbound_no inboundNo,i.date_key dateKey,i.supplier_name supplierName,i.supplier_ref supplierRef,l.variant_id variantId,v.product_name productName,v.color,v.size,v.grade,l.qty_input qtyInput,l.input_unit inputUnit,l.qty_base qtyBase,l.unit_cost_rp unitCostRp,l.line_total_rp lineTotalRp FROM plastic_inbound i JOIN plastic_inbound_line l ON l.inbound_id=i.inbound_id JOIN plastic_product_variant v ON v.variant_id=l.variant_id WHERE i.business_unit_id='BU-PLASTIC' AND i.period_key=? ORDER BY i.date_key DESC,i.created_at DESC LIMIT 500`,period).toArray()};
if(view==='OUTBOUND')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT i.invoice_id invoiceId,i.invoice_no invoiceNo,i.date_key dateKey,COALESCE(c.customer_name,'') customerName,i.status,i.grand_total_rp grandTotalRp,COALESCE(SUM(l.cogs_total_rp),0) cogsRp FROM plastic_sales_invoice i LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id LEFT JOIN plastic_sales_line l ON l.invoice_id=i.invoice_id WHERE i.business_unit_id='BU-PLASTIC' AND i.period_key=? AND i.status<>'VOID' GROUP BY i.invoice_id ORDER BY i.date_key DESC,i.created_at DESC LIMIT 300`,period).toArray().map((r:any)=>{const p=paid(sql,String(r.invoiceId)),out=Math.max(0,N(r.grandTotalRp)-p);return{...r,paidRp:p,outstandingRp:out,grossProfitRp:N(r.grandTotalRp)-N(r.cogsRp),paymentLabel:out<=0?'PAID':'NOT PAID'}})};
if(view==='INVENTORY')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT v.variant_id variantId,v.product_name productName,v.category,v.color,v.size,v.grade,v.base_unit baseUnit,v.mid_unit midUnit,v.pack_unit packUnit,v.units_per_mid unitsPerMid,v.units_per_pack unitsPerPack,COALESCE(b.qty_base,0) qtyBase,COALESCE(b.avg_cost_rp,0) avgCostRp,ROUND(COALESCE(b.qty_base,0)*COALESCE(b.avg_cost_rp,0)) stockValueRp FROM plastic_product_variant v LEFT JOIN plastic_inventory_balance b ON b.business_unit_id=v.business_unit_id AND b.variant_id=v.variant_id WHERE v.business_unit_id='BU-PLASTIC' AND v.active=1 ORDER BY v.category,v.product_name,v.color,v.size`).toArray()};
if(view==='RECEIVABLES')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT i.invoice_id invoiceId,i.invoice_no invoiceNo,i.date_key dateKey,i.customer_id customerId,COALESCE(c.customer_name,'') customerName,i.grand_total_rp grandTotalRp,i.due_date_key dueDateKey,i.status FROM plastic_sales_invoice i LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id WHERE i.business_unit_id='BU-PLASTIC' AND i.status<>'VOID' ORDER BY i.date_key,i.invoice_no`).toArray().map((r:any)=>{const p=paid(sql,String(r.invoiceId));return{...r,paidRp:p,outstandingRp:Math.max(0,N(r.grandTotalRp)-p)}}).filter((r:any)=>r.outstandingRp>0)};
if(view==='REPORTS')return{view,periodKey:period,actor:a,inbound:sql.exec(`SELECT i.date_key dateKey,i.inbound_no referenceNo,i.supplier_name partyName,v.product_name productName,v.color,v.size,l.qty_input qty,l.input_unit unit,l.qty_base qtyBase,l.line_total_rp totalRp FROM plastic_inbound i JOIN plastic_inbound_line l ON l.inbound_id=i.inbound_id JOIN plastic_product_variant v ON v.variant_id=l.variant_id WHERE i.business_unit_id='BU-PLASTIC' AND i.period_key=? ORDER BY i.date_key`,period).toArray(),outbound:sql.exec(`SELECT i.date_key dateKey,i.invoice_no referenceNo,COALESCE(c.customer_name,'') partyName,v.product_name productName,v.color,v.size,l.qty_base qtyBase,l.line_total_rp totalRp,l.cogs_total_rp cogsRp,(l.line_total_rp-l.cogs_total_rp) grossProfitRp FROM plastic_sales_invoice i JOIN plastic_sales_line l ON l.invoice_id=i.invoice_id JOIN plastic_product_variant v ON v.variant_id=l.variant_id LEFT JOIN plastic_customer c ON c.customer_id=i.customer_id WHERE i.business_unit_id='BU-PLASTIC' AND i.period_key=? AND i.status<>'VOID' ORDER BY i.date_key`,period).toArray()};
if(view==='CLOSING')return{view,periodKey:period,actor:a,current:sql.exec(`SELECT * FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' AND period_key=? LIMIT 1`,period).toArray()[0]??{period_key:period,status:'OPEN'},history:sql.exec(`SELECT * FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' ORDER BY period_key DESC LIMIT 24`).toArray()};
if(view==='AUDIT')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT id,actor_user_id actorUserId,action,entity_type entityType,entity_id entityId,reason,created_at createdAt FROM audit_log WHERE business_unit_id='BU-PLASTIC' ORDER BY created_at DESC LIMIT 300`).toArray()};
if(view==='OPNAME')return{view,periodKey:period,actor:a,rows:sql.exec(`SELECT o.opname_no opnameNo,o.date_key dateKey,o.reason,l.variant_id variantId,v.product_name productName,v.color,v.size,l.system_qty_base systemQtyBase,l.physical_qty_base physicalQtyBase,l.variance_qty_base varianceQtyBase FROM plastic_stock_opname o JOIN plastic_stock_opname_line l ON l.opname_id=o.opname_id JOIN plastic_product_variant v ON v.variant_id=l.variant_id WHERE o.business_unit_id='BU-PLASTIC' AND o.period_key=? ORDER BY o.date_key DESC,o.created_at DESC LIMIT 300`,period).toArray()};
throw Error('PLASTIC_VIEW_UNSUPPORTED')}

export function mutatePlasticTradingV2(storage:any,actorId:string,cmdV:string,payloadV:any={}){const sql:Sql=storage.sql;const a=actor(sql,actorId),cmd=T(cmdV,40).toUpperCase(),p=payloadV&&typeof payloadV==='object'?payloadV:{};const atomic=<T,>(f:()=>T):T=>typeof storage.transactionSync==='function'?storage.transactionSync(f):f();
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
             WHEN source_type IN('OPENING_REVISION','OPENING_VOID')
               AND movement_type='ADJUSTMENT_IN' THEN qty_base
             WHEN source_type IN('OPENING_REVISION','OPENING_VOID')
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

if(cmd==='CREATE_INBOUND'){op(a);const date=DK(p.dateKey),period=date.slice(0,7);open(sql,period);const lines=Array.isArray(p.lines)?p.lines:[];if(!lines.length)throw Error('PLASTIC_INBOUND_LINES_REQUIRED');return atomic(()=>{const id=crypto.randomUUID(),no='PIN-'+date.replaceAll('-','')+'-'+id.replaceAll('-','').slice(0,6).toUpperCase(),t=now();let total=0;const norm=lines.map((r:any)=>{const vid=T(r.variantId,120),v=variant(sql,vid),q=baseQty(v,r.qty,r.unit),inputCost=I(r.unitCostRp),baseCost=q.multiplier>0?Math.round(inputCost/q.multiplier):inputCost,sum=Math.round(q.qty*inputCost);total+=sum;return{vid,v,...q,inputCost,baseCost,sum}});sql.exec(`INSERT INTO plastic_inbound(inbound_id,business_unit_id,inbound_no,supplier_name,supplier_ref,period_key,date_key,total_value_rp,note,actor_user_id,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,?,?,?)`,id,no,T(p.supplierName,160),T(p.supplierRef,160),period,date,total,T(p.note,500),a.id,t).toArray();for(const r of norm){sql.exec(`INSERT INTO plastic_inbound_line(line_id,inbound_id,variant_id,qty_input,input_unit,qty_base,unit_cost_rp,line_total_rp,created_at) VALUES(?,?,?,?,?,?,?,?,?)`,crypto.randomUUID(),id,r.vid,r.qty,r.unit,r.baseQty,r.baseCost,r.sum,t).toArray();const b=sql.exec(`SELECT qty_base,avg_cost_rp FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC' AND variant_id=? LIMIT 1`,r.vid).toArray()[0];const oq=N(b?.qty_base),oa=N(b?.avg_cost_rp),nq=oq+r.baseQty,na=nq>0?Math.round((oq*oa+r.baseQty*r.baseCost)/nq):0;sql.exec(`INSERT INTO plastic_inventory_balance(business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at) VALUES('BU-PLASTIC',?,?,?,?) ON CONFLICT(business_unit_id,variant_id) DO UPDATE SET qty_base=excluded.qty_base,avg_cost_rp=excluded.avg_cost_rp,updated_at=excluded.updated_at`,r.vid,nq,na,t).toArray();sql.exec(`INSERT INTO plastic_inventory_movement(movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,'IN',?,?,?,?,?,?,?,?)`,crypto.randomUUID(),r.vid,period,date,r.baseQty,r.baseCost,'INBOUND',id,a.id,T(p.note,500),t,t).toArray()}audit(sql,a,'PLASTIC_IN_CREATE','PLASTIC_INBOUND',id,'',{no,total});return{ok:true,inboundId:id,inboundNo:no,totalValueRp:total}})}
if(cmd==='CREATE_SALE'){op(a);const date=DK(p.dateKey),period=date.slice(0,7);open(sql,period);const requestedCustomerId=T(p.customerId,120),requestedCustomerName=T(p.customerName,160);const lines=Array.isArray(p.lines)?p.lines:[];if(!lines.length)throw Error('PLASTIC_SALE_LINES_REQUIRED');return atomic(()=>{let cust=requestedCustomerId,customerName=requestedCustomerName;const t=now();if(cust){const existing=sql.exec(`SELECT customer_id,customer_name FROM plastic_customer WHERE business_unit_id='BU-PLASTIC' AND customer_id=? AND active=1 LIMIT 1`,cust).toArray()[0];if(!existing)throw Error('PLASTIC_CUSTOMER_NOT_FOUND');customerName=T(existing.customer_name,160)}else{if(!customerName)throw Error('PLASTIC_CUSTOMER_REQUIRED');const existing=sql.exec(`SELECT customer_id,customer_name FROM plastic_customer WHERE business_unit_id='BU-PLASTIC' AND active=1 AND LOWER(TRIM(customer_name))=LOWER(TRIM(?)) ORDER BY created_at LIMIT 1`,customerName).toArray()[0];if(existing){cust=T(existing.customer_id,120);customerName=T(existing.customer_name,160)}else{cust=crypto.randomUUID();sql.exec(`INSERT INTO plastic_customer(customer_id,business_unit_id,customer_name,phone,address,notes,active,created_at,updated_at) VALUES(?,'BU-PLASTIC',?,'','','Auto-created from sales entry',1,?,?)`,cust,customerName,t,t).toArray();audit(sql,a,'PLASTIC_CUSTOMER_AUTO_CREATE','PLASTIC_CUSTOMER',cust,'',{customerName})}}const id=crypto.randomUUID(),no='PTR-'+date.replaceAll('-','')+'-'+id.replaceAll('-','').slice(0,6).toUpperCase();let subtotal=0,cogs=0;const norm=lines.map((r:any)=>{const vid=T(r.variantId,120),v=variant(sql,vid),q=baseQty(v,r.qty,r.unit),b=sql.exec(`SELECT qty_base,avg_cost_rp FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC' AND variant_id=? LIMIT 1`,vid).toArray()[0],avail=N(b?.qty_base);if(q.baseQty>avail+1e-9)throw Error('PLASTIC_INSUFFICIENT_STOCK');let price=I(r.unitPriceRp);if(price<=0){const mid=String(v.mid_unit||'').toUpperCase();price=q.unit===String(v.pack_unit).toUpperCase()?I(v.default_sell_price_pack_rp):mid&&q.unit===mid?I(v.default_sell_price_mid_rp):I(v.default_sell_price_base_rp)};const sum=Math.round(q.qty*price),uc=I(b?.avg_cost_rp),cg=Math.round(q.baseQty*uc);subtotal+=sum;cogs+=cg;return{vid,v,...q,avail,price,sum,uc,cg}});const disc=Math.min(subtotal,I(p.discountRp)),ship=I(p.shippingRp),grand=Math.max(0,subtotal-disc+ship),paymentStatus=T(p.paymentStatus||'NOT_PAID',20).toUpperCase().replaceAll(' ','_');if(!['PAID','NOT_PAID'].includes(paymentStatus))throw Error('PLASTIC_PAYMENT_STATUS_INVALID');const pay=paymentStatus==='PAID'?grand:0,status=paymentStatus==='PAID'?'PAID':'OPEN';sql.exec(`INSERT INTO plastic_sales_invoice(invoice_id,business_unit_id,invoice_no,customer_id,period_key,date_key,status,subtotal_rp,discount_rp,shipping_rp,grand_total_rp,due_date_key,note,actor_user_id,occurred_at,created_at,updated_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,id,no,cust,period,date,status,subtotal,disc,ship,grand,T(p.dueDateKey,10),T(p.note,500),a.id,t,t,t).toArray();for(const r of norm){sql.exec(`INSERT INTO plastic_sales_line(line_id,invoice_id,variant_id,qty_input,input_unit,qty_base,unit_price_rp,line_total_rp,unit_cogs_rp,cogs_total_rp,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,crypto.randomUUID(),id,r.vid,r.qty,r.unit,r.baseQty,r.price,r.sum,r.uc,r.cg,t).toArray();sql.exec(`UPDATE plastic_inventory_balance SET qty_base=?,updated_at=? WHERE business_unit_id='BU-PLASTIC' AND variant_id=?`,r.avail-r.baseQty,t,r.vid).toArray();sql.exec(`INSERT INTO plastic_inventory_movement(movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,'OUT',?,?,?,?,?,?,?,?)`,crypto.randomUUID(),r.vid,period,date,r.baseQty,r.uc,'SALE',id,a.id,T(p.note,500),t,t).toArray()}if(pay>0)sql.exec(`INSERT INTO plastic_payment(payment_id,business_unit_id,invoice_id,customer_id,period_key,date_key,amount_rp,payment_method,status,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,'POSTED',?,'Initial payment',?,?)`,crypto.randomUUID(),id,cust,period,date,pay,T(p.paymentMethod,64),a.id,t,t).toArray();audit(sql,a,'PLASTIC_SALE_CREATE','PLASTIC_SALES_INVOICE',id,'',{no,customerId:cust,customerName,grand,pay,cogs});return{ok:true,invoiceId:id,invoiceNo:no,customerId:cust,customerName,grandTotalRp:grand,cogsRp:cogs,grossProfitRp:grand-cogs,outstandingRp:grand-pay}})}
if(cmd==='ADD_PAYMENT'){op(a);const id=T(p.invoiceId,120),inv=sql.exec(`SELECT * FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND invoice_id=? AND status<>'VOID' LIMIT 1`,id).toArray()[0];if(!inv)throw Error('PLASTIC_INVOICE_NOT_FOUND');open(sql,String(inv.period_key));const amount=I(p.amountRp),already=paid(sql,id),remain=Math.max(0,N(inv.grand_total_rp)-already);if(amount<=0)throw Error('PLASTIC_PAYMENT_INVALID');if(amount>remain)throw Error('PLASTIC_PAYMENT_EXCEEDS_OUTSTANDING');const t=now(),date=p.dateKey?DK(p.dateKey):String(inv.date_key);sql.exec(`INSERT INTO plastic_payment(payment_id,business_unit_id,invoice_id,customer_id,period_key,date_key,amount_rp,payment_method,status,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,'POSTED',?,?,?,?)`,crypto.randomUUID(),id,String(inv.customer_id),String(inv.period_key),date,amount,T(p.paymentMethod,64),a.id,T(p.note,300),t,t).toArray();const total=already+amount,status=total>=N(inv.grand_total_rp)?'PAID':'PARTIAL';sql.exec(`UPDATE plastic_sales_invoice SET status=?,updated_at=? WHERE invoice_id=?`,status,t,id).toArray();audit(sql,a,'PLASTIC_PAYMENT_CREATE','PLASTIC_PAYMENT',id,'',{amount});return{ok:true,invoiceId:id,outstandingRp:N(inv.grand_total_rp)-total}}
if(cmd==='POST_OPNAME'){mg(a);const date=DK(p.dateKey),period=date.slice(0,7),reason=T(p.reason,500);open(sql,period);if(!reason)throw Error('PLASTIC_REASON_REQUIRED');const lines=Array.isArray(p.lines)?p.lines:[];if(!lines.length)throw Error('PLASTIC_OPNAME_LINES_REQUIRED');return atomic(()=>{const id=crypto.randomUUID(),no='SO-'+date.replaceAll('-','')+'-'+id.replaceAll('-','').slice(0,6).toUpperCase(),t=now();sql.exec(`INSERT INTO plastic_stock_opname(opname_id,business_unit_id,opname_no,period_key,date_key,reason,actor_user_id,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?)`,id,no,period,date,reason,a.id,t).toArray();for(const r of lines){const vid=T(r.variantId,120);variant(sql,vid);const b=sql.exec(`SELECT qty_base,avg_cost_rp FROM plastic_inventory_balance WHERE business_unit_id='BU-PLASTIC' AND variant_id=? LIMIT 1`,vid).toArray()[0],sys=N(b?.qty_base),phy=Math.max(0,N(r.physicalQtyBase)),diff=phy-sys;sql.exec(`INSERT INTO plastic_stock_opname_line(line_id,opname_id,variant_id,system_qty_base,physical_qty_base,variance_qty_base,created_at) VALUES(?,?,?,?,?,?,?)`,crypto.randomUUID(),id,vid,sys,phy,diff,t).toArray();sql.exec(`INSERT INTO plastic_inventory_balance(business_unit_id,variant_id,qty_base,avg_cost_rp,updated_at) VALUES('BU-PLASTIC',?,?,?,?) ON CONFLICT(business_unit_id,variant_id) DO UPDATE SET qty_base=excluded.qty_base,updated_at=excluded.updated_at`,vid,phy,I(b?.avg_cost_rp),t).toArray();if(Math.abs(diff)>1e-9)sql.exec(`INSERT INTO plastic_inventory_movement(movement_id,business_unit_id,variant_id,period_key,date_key,movement_type,qty_base,unit_cost_rp,source_type,source_key,actor_user_id,note,occurred_at,created_at) VALUES(?,'BU-PLASTIC',?,?,?,?,?,?,? ,?,?,?,?,?)`,crypto.randomUUID(),vid,period,date,diff>0?'ADJUSTMENT_IN':'ADJUSTMENT_OUT',Math.abs(diff),I(b?.avg_cost_rp),'STOCK_OPNAME',id,a.id,reason,t,t).toArray()}audit(sql,a,'PLASTIC_STOCK_OPNAME_CLOSE','PLASTIC_STOCK_OPNAME',id,reason,{no});return{ok:true,opnameId:id,opnameNo:no}})}
if(cmd==='CLOSE_PERIOD'){ow(a);const period=PK(p.periodKey);open(sql,period);const start=period+'-01';const [y,m]=period.split('-').map(Number),next=new Date(Date.UTC(y,m,1)),end=`${next.getUTCFullYear()}-${String(next.getUTCMonth()+1).padStart(2,'0')}-01`;const mov=sql.exec(`SELECT movement_type,qty_base,unit_cost_rp,date_key FROM plastic_inventory_movement WHERE business_unit_id='BU-PLASTIC' AND date_key<?`,end).toArray();let opening=0,inn=0,out=0,adj=0,val=0;for(const r of mov){const type=String(r.movement_type),q=N(r.qty_base),sg=['OPENING','IN','RETURN_IN','ADJUSTMENT_IN'].includes(type)?1:-1;val+=Math.round(sg*q*N(r.unit_cost_rp));if(String(r.date_key)<start){opening+=sg*q;continue}if(['IN','RETURN_IN'].includes(type))inn+=q;else if(['OUT','RETURN_OUT'].includes(type))out+=q;else if(type==='ADJUSTMENT_IN')adj+=q;else if(type==='ADJUSTMENT_OUT')adj-=q}const closing=opening+inn-out+adj,sales=scalar(sql,`SELECT COALESCE(SUM(grand_total_rp),0) value FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND period_key=? AND status<>'VOID'`,period),cogs=scalar(sql,`SELECT COALESCE(SUM(l.cogs_total_rp),0) value FROM plastic_sales_line l JOIN plastic_sales_invoice i ON i.invoice_id=l.invoice_id WHERE i.business_unit_id='BU-PLASTIC' AND i.period_key=? AND i.status<>'VOID'`,period);let rec=0;for(const inv of sql.exec(`SELECT invoice_id,grand_total_rp FROM plastic_sales_invoice WHERE business_unit_id='BU-PLASTIC' AND period_key=? AND status<>'VOID'`,period).toArray())rec+=Math.max(0,N(inv.grand_total_rp)-paid(sql,String(inv.invoice_id)));const t=now();sql.exec(`INSERT INTO plastic_month_close(business_unit_id,period_key,status,opening_stock_qty,inbound_qty,outbound_qty,adjustment_qty,closing_stock_qty,sales_rp,cogs_rp,gross_profit_rp,receivable_rp,closing_inventory_value_rp,closed_at,closed_by,reopen_reason,updated_at) VALUES('BU-PLASTIC',?,'CLOSED',?,?,?,?,?,?,?,?,?,?,?,?,'',?) ON CONFLICT(business_unit_id,period_key) DO UPDATE SET status='CLOSED',opening_stock_qty=excluded.opening_stock_qty,inbound_qty=excluded.inbound_qty,outbound_qty=excluded.outbound_qty,adjustment_qty=excluded.adjustment_qty,closing_stock_qty=excluded.closing_stock_qty,sales_rp=excluded.sales_rp,cogs_rp=excluded.cogs_rp,gross_profit_rp=excluded.gross_profit_rp,receivable_rp=excluded.receivable_rp,closing_inventory_value_rp=excluded.closing_inventory_value_rp,closed_at=excluded.closed_at,closed_by=excluded.closed_by,reopen_reason='',updated_at=excluded.updated_at`,period,opening,inn,out,adj,closing,sales,cogs,sales-cogs,rec,Math.max(0,val),t,a.id,t).toArray();audit(sql,a,'PLASTIC_MONTH_CLOSE','PLASTIC_MONTH_CLOSE',period,T(p.reason,500),{opening,inn,out,adj,closing,sales,cogs,rec});return{ok:true,periodKey:period,status:'CLOSED'}}
if(cmd==='REOPEN_PERIOD'){ow(a);const period=PK(p.periodKey),reason=T(p.reason,500);if(!reason)throw Error('PLASTIC_REASON_REQUIRED');const r=sql.exec(`SELECT status FROM plastic_month_close WHERE business_unit_id='BU-PLASTIC' AND period_key=? LIMIT 1`,period).toArray()[0];if(String(r?.status)!=='CLOSED')throw Error('PLASTIC_PERIOD_NOT_CLOSED');sql.exec(`UPDATE plastic_month_close SET status='OPEN',reopen_reason=?,updated_at=? WHERE business_unit_id='BU-PLASTIC' AND period_key=?`,reason,now(),period).toArray();audit(sql,a,'PLASTIC_MONTH_REOPEN','PLASTIC_MONTH_CLOSE',period,reason,{});return{ok:true,periodKey:period,status:'OPEN'}}
throw Error('PLASTIC_COMMAND_UNSUPPORTED')}
