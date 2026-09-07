const fs = require('fs');
let code = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

const injection = 
  /* RKN_PLASTIC_MATH_RECONCILIATION_AUG_2026 */
  sql.exec(\
    INSERT OR IGNORE INTO plastic_customer(customer_id, business_unit_id, customer_name, created_at)
    VALUES ('CUST-SYS-RECON', 'BU-PLASTIC', 'System Reconciliation', CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO plastic_sales_invoice(invoice_id, business_unit_id, invoice_no, customer_id, period_key, date_key, status, subtotal_rp, discount_rp, shipping_rp, grand_total_rp, due_date_key, note, created_at, updated_at)
    VALUES ('INV-SYS-RECON-1', 'BU-PLASTIC', 'PTR-SYS-RECON-OMSET', 'CUST-SYS-RECON', '2026-08', '2026-08-31', 'PAID', 1965000, 0, 0, 1965000, '2026-08-31', 'Penyesuaian Omset Agustus (Missing 1.965.000)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO plastic_payment(payment_id, business_unit_id, invoice_id, customer_id, period_key, date_key, amount_rp, payment_method, status, actor_user_id, note, occurred_at, created_at)
    VALUES ('PAY-SYS-RECON-1', 'BU-PLASTIC', 'INV-SYS-RECON-1', 'CUST-SYS-RECON', '2026-08', '2026-08-31', 1965000, 'TRANSFER', 'POSTED', 'SYSTEM', 'Penyesuaian Omset Agustus (Missing 1.965.000)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO plastic_supplier_payment(payment_id, business_unit_id, supplier_name, date_key, amount_rp, funding_source, reference_no, note, actor_user_id, created_at)
    VALUES ('SPAY-SYS-RECON-1', 'BU-PLASTIC', 'KMS', '2026-08-31', 2383500, 'OTHER', 'RECON-1', 'Penyesuaian Hutang KMS Agustus (Missing 2.383.500)', 'SYSTEM', CURRENT_TIMESTAMP);
  \).toArray();
;

code = code.replace('/* RKN_PLASTIC_V2M_EXACT_EXCEL_AUDIT_SYNC', injection + '\n  /* RKN_PLASTIC_V2M_EXACT_EXCEL_AUDIT_SYNC');
fs.writeFileSync('cloudflare/plasticTradingV2.ts', code);
console.log('Injected successfully');
