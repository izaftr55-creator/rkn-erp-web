-- RKN ERP Data Master (Plastik & Thermal)
-- Menambahkan data awal ke tabel products

INSERT INTO products (product_id, sku, product_name, category, variant, unit, status) VALUES 
  ('PRD-PL-001', 'HITAM-15x25', 'Plastik Hitam 15x25', 'Plastik Kemasan', 'Hitam', 'ROLL', 'ACTIVE'),
  ('PRD-PL-002', 'HITAM-17x30', 'Plastik Hitam 17x30', 'Plastik Kemasan', 'Hitam', 'ROLL', 'ACTIVE'),
  ('PRD-PL-003', 'PINK-15x25', 'Plastik Pink 15x25', 'Plastik Kemasan', 'Pink', 'ROLL', 'ACTIVE'),
  ('PRD-TH-001', 'THERMAL-GOLDWIN-100x150', 'Thermal Goldwin 100x150', 'Thermal', 'Goldwin', 'STACK', 'ACTIVE'),
  ('PRD-TH-002', 'THERMAL-DPANJANG-100x150', 'Thermal Dus Panjang (Tanpa Merk)', 'Thermal', 'Dus Panjang', 'STACK', 'ACTIVE'),
  ('PRD-TH-003', 'THERMAL-DKOTAK-100x150', 'Thermal Dus Kotak (Tanpa Merk)', 'Thermal', 'Dus Kotak', 'STACK', 'ACTIVE')
ON CONFLICT (sku) DO NOTHING;