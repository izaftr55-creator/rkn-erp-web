-- RKN ERP production database blueprint (PostgreSQL / Supabase compatible)

create table owners (
  owner_id text primary key,
  owner_name text not null,
  business_name text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table stores (
  store_id text primary key,
  owner_id text not null references owners(owner_id),
  platform text not null,
  store_name text not null,
  store_code text,
  status text not null default 'ACTIVE',
  api_status text not null default 'NOT_CONNECTED',
  store_url text,
  created_at timestamptz not null default now()
);

create table products (
  product_id text primary key,
  sku text not null unique,
  product_name text not null,
  category text,
  variant text,
  unit text not null default 'PCS',
  hpp_default numeric(18,2) not null default 0,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table listings (
  listing_id text primary key,
  store_id text not null references stores(store_id),
  marketplace_product_id text,
  product_name_marketplace text not null,
  product_family text,
  sku_induk text,
  sku_varian text,
  variant text,
  qty_paket integer not null default 1,
  hpp numeric(18,2),
  harga_jual numeric(18,2),
  listing_status text not null default 'DRAFT',
  product_url text,
  source_file text,
  notes text,
  updated_at timestamptz not null default now(),
  unique(store_id, marketplace_product_id, sku_varian)
);

create table warehouses (
  warehouse_id text primary key,
  warehouse_name text not null,
  status text not null default 'ACTIVE'
);

create table stock_movements (
  movement_id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  warehouse_id text not null references warehouses(warehouse_id),
  sku text not null references products(sku),
  movement_type text not null check (movement_type in (
    'OPENING','IN','OUT','SALE','RETURN','LOAN_OUT','LOAN_IN','ADJUSTMENT'
  )),
  qty numeric(18,3) not null,
  store_id text references stores(store_id),
  reference_type text,
  reference_id text,
  unit_cost numeric(18,2),
  notes text
);

create index idx_listings_store on listings(store_id);
create index idx_listings_sku_induk on listings(sku_induk);
create index idx_stock_sku_time on stock_movements(sku, occurred_at);
create index idx_stock_store_time on stock_movements(store_id, occurred_at);

create view current_stock as
select
  warehouse_id,
  sku,
  sum(
    case
      when movement_type in ('OPENING','IN','RETURN','LOAN_IN') then qty
      when movement_type in ('OUT','SALE','LOAN_OUT') then -qty
      when movement_type = 'ADJUSTMENT' then qty
      else 0
    end
  ) as qty_on_hand
from stock_movements
group by warehouse_id, sku;

-- Tabel untuk menampung webhook/event mentah dari Marketplace (Priority 1 & 2)
create table raw_integration_events (
  event_id text primary key,
  provider text not null, -- 'SHOPEE', 'TIKTOK', dll
  event_type text not null,
  store_id text, -- Bisa null jika event bersifat global
  payload jsonb not null,
  processing_status text not null default 'RECEIVED', -- RECEIVED, PROCESSING, PROCESSED, FAILED, REVIEW
  occurred_at timestamptz,
  received_at timestamptz not null default now(),
  error_state text
);

create index idx_raw_events_provider on raw_integration_events(provider, processing_status);
create index idx_raw_events_store on raw_integration_events(store_id);

-- Tabel untuk menampung Hutang (Payable) dan Piutang (Receivable) Bisnis
create table trade_debts (
  debt_id text primary key,
  debt_type text not null check (debt_type in ('PAYABLE', 'RECEIVABLE')), -- PAYABLE = Hutang (Kita ke Supplier), RECEIVABLE = Piutang (Customer ke Kita)
  counterparty_name text not null, -- Nama Supplier atau Customer
  amount_total numeric(18,2) not null,
  amount_paid numeric(18,2) not null default 0,
  status text not null default 'UNPAID', -- UNPAID, PARTIAL, PAID
  due_date timestamptz,
  reference_type text, -- Misal: 'PURCHASE_ORDER', 'SALES_ORDER', 'LENDING'
  reference_id text, -- ID Order / ID Transaksi yang mendasari
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trade_debts_type_status on trade_debts(debt_type, status);
create index idx_trade_debts_counterparty on trade_debts(counterparty_name);

-- Tabel Master Pelanggan (Untuk keperluan B2B dan Invoice)
create table customers (
  customer_id text primary key,
  name text not null,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

-- Tabel Pesanan Penjualan (Bisa dari Manual B2B atau Marketplace nantinya)
create table sales_orders (
  order_id text primary key,
  customer_id text references customers(customer_id), -- Bisa null jika order dari marketplace tanpa data customer spesifik
  order_source text not null default 'MANUAL_B2B', -- MANUAL_B2B, SHOPEE, TIKTOK
  total_amount numeric(18,2) not null,
  payment_status text not null default 'UNPAID', -- PAID (Lunas), UNPAID (Ngutang/Tempo), PARTIAL
  order_status text not null default 'COMPLETED', -- DRAFT, COMPLETED, CANCELLED
  invoice_number text unique, -- Nomor Invoice yang di-generate sistem (misal: INV/2026/08/001)
  created_at timestamptz not null default now()
);

-- Tabel Rincian Barang per Pesanan (Muncul di baris Invoice)
create table sales_order_lines (
  line_id text primary key,
  order_id text not null references sales_orders(order_id),
  sku text not null references products(sku),
  qty numeric(18,3) not null,
  unit_price numeric(18,2) not null,
  subtotal numeric(18,2) not null
);

create index idx_sales_orders_customer on sales_orders(customer_id);
create index idx_sales_orders_invoice on sales_orders(invoice_number);
