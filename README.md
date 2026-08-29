# RKN ERP Web v4.5.0 — Multi-Account Canonical Sync

Patch kalibrasi besar untuk 8 akun marketplace. Target utamanya: **produk fisik yang sama memakai SKU canonical yang sama di semua akun Shopee dan TikTok**, sementara Seller SKU lama hanya dipakai sebagai bukti identitas/migrasi.

## Shared Canonical Master
- Satu produk fisik + warna + ukuran = satu SKU canonical lintas toko/platform.
- Parent SKU canonical mengikuti family master (`RKN-PRD-...`).
- Bundle memakai namespace canonical bersama; SKU toko lama tidak dijadikan master baru.
- Random/free-choice menggunakan SKU virtual dan tidak membuat stok fisik palsu.
- Mapping tetap konservatif: data yang tidak cukup bukti tetap `Review`, tidak dipaksa `Ready`.

## Kalibrasi 8 Akun
Sudah diuji terhadap file Mass Update resmi dari seluruh akun:
- Shopee RKN Hijab Official
- Shopee erkaenscarf
- Shopee erkaenveil
- Shopee jenna_collection09
- Shopee Orviellé ID
- TikTok RKN Hijab
- TikTok Kharisma Hijab
- TikTok erkaenveil

Hasil verifikasi resolver pada dataset kalibrasi:
- Orviellé Shopee: 220 Ready, 0 Review, 0 Blocked
- Jenna Shopee: 1.380 Ready, 0 Review, 0 Blocked
- erkaenveil Shopee: 622 Ready, 9 Review, 0 Blocked
- erkaenscarf Shopee: 1.378 Ready, 23 Review, 0 Blocked
- RKN Shopee: 1.381 Ready, 0 Review, 0 Blocked, 136 Archived
- erkaenveil TikTok: 631 Ready, 0 Review, 0 Blocked
- Kharisma TikTok: 1.383 Ready, 0 Review, 0 Blocked
- RKN TikTok: 970 Ready, 0 Review, 0 Blocked

Total: **8.133 baris terbaca; 8.101 sudah diputuskan; 32 Review aman; 0 Blocked**.

## TikTok ZIP Parser
- Parser TikTok sekarang membaca worksheet XLSX di dalam ZIP secara langsung dari XML.
- Product ID dan SKU ID panjang (17–19 digit) dipertahankan sebagai string agar tidak rusak karena pembulatan JavaScript.
- Header template dicari secara dinamis pada baris awal, sehingga file Seller Center tidak lagi terbaca `0 baris`.

## Product Identity & Color
- Product ID memory lintas akun diperluas untuk listing yang sudah memiliki bukti kuat.
- Alias warna/typo dinormalisasi secara family-specific bila perlu.
- Rule lama yang aman tetap dipertahankan, termasuk CPD/CPD-AB/CPT/CPT-AB/CPT-RYN, PSM/PSM-J, BHM/BSM, Scrunchie, Bolero, dan aturan legacy/archive RKN.
- `Pink Peach` Scrunchie Jumbo tetap menuju Baby Pink (`SCR-J-22`).
- `BLR-M-16` tetap Sage.

## Blueprint Master
Blueprint sudah diperluas untuk kebutuhan lintas akun:
- `MASTER_PRODUCT`: **46 family**.
- `MASTER_SKU_COLOR`: **935 SKU fisik/warna**.
- `MASTER_COLOR`: **82 warna** dan formula dinamis diperluas sampai master row 1200.
- Family penting yang sebelumnya belum ada sudah ditambahkan, termasuk PSH-JRS, HSP-M, MST-JMP, NAY-M, DER-M, keluarga bergo/tali/anak, pashmina non-instan, square, dan segitiga tambahan.

## Review yang Sengaja Dipertahankan
32 baris tidak dipaksa ke canonical karena file marketplace belum memberi bukti yang cukup:
1. 9 varian Shopee erkaenveil Product ID `48001564420` — paket Scrunchie Jumbo + Medium; urutan warna Jumbo/Medium belum terbukti.
2. 17 varian HJB-JIS-2IN1 Shopee Kharisma memakai warna di luar 14 warna resmi guide; perlu keputusan apakah warna fisik aktif atau legacy.
3. 6 listing `Custom` Shopee Kharisma tanpa identitas produk yang cukup; perlu identifikasi atau keputusan archive.

## UI
- Banner engine: **Multi-Account Canonical Engine v4.0**.
- Layer marketplace dan inventory tetap dipisahkan.
- Tampilan Calibri/Title Case dari v4.4.14 tetap dipertahankan.

## Safety
- Zero-Credential Mode tetap aktif.
- Tidak menyertakan `.env.local`, password, token, cookie, OTP, atau credential marketplace.
- Patch hanya overlay source app; konfigurasi lokal tidak disentuh.
Git deployment baseline verified.
