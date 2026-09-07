const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec(\
CREATE TABLE plastic_product_variant(variant_id TEXT, pack_unit TEXT, mid_unit TEXT, default_sell_price_pack_rp REAL, default_sell_price_mid_rp REAL, default_sell_price_base_rp REAL);
INSERT INTO plastic_product_variant VALUES ('V1', 'PACK', 'ROLL', 100, 50, 10);

CREATE TABLE plastic_sales_line(variant_id TEXT, input_unit TEXT, unit_price_rp REAL, qty_input REAL, line_total_rp REAL, invoice_id TEXT);
INSERT INTO plastic_sales_line VALUES ('V1', 'ROLL', 0, 2, 0, 'INV1');

UPDATE plastic_sales_line SET unit_price_rp = (SELECT CASE WHEN plastic_sales_line.input_unit = UPPER(v.pack_unit) THEN v.default_sell_price_pack_rp WHEN plastic_sales_line.input_unit = UPPER(v.mid_unit) THEN v.default_sell_price_mid_rp ELSE v.default_sell_price_base_rp END FROM plastic_product_variant v WHERE v.variant_id = plastic_sales_line.variant_id);

CREATE TABLE plastic_sales_invoice(invoice_id TEXT, subtotal_rp REAL, discount_rp REAL, shipping_rp REAL, grand_total_rp REAL, status TEXT);
INSERT INTO plastic_sales_invoice VALUES ('INV1', 0, 0, 0, 0, 'OPEN');

UPDATE plastic_sales_line SET line_total_rp = qty_input * unit_price_rp;
UPDATE plastic_sales_invoice SET subtotal_rp = (SELECT COALESCE(SUM(line_total_rp), 0) FROM plastic_sales_line WHERE invoice_id = plastic_sales_invoice.invoice_id);
UPDATE plastic_sales_invoice SET grand_total_rp = MAX(0, subtotal_rp - discount_rp + shipping_rp);
\);
console.log(db.prepare("SELECT * FROM plastic_sales_invoice").all());
console.log(db.prepare("SELECT * FROM plastic_sales_line").all());
