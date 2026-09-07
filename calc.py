import pandas as pd
import re

text = """
PINK 20X30 10 ROLL ZAHRA UNPAID
PINK 20X30 5 ROLL ZAHRA UNPAID
PINK 20X30 1 BALL ZAHRA UNPAID
PUTIH A 17X30 2 BALL ZAHRA UNPAID
PUTIH A 20X30 2 BALL ZAHRA UNPAID
UNGU 15X25 1 BALL EMAL BHS UNPAID
PUTIH A 17X30 2 BALL ZAHRA UNPAID
PUTIH A 20X30 2 BALL ZAHRA UNPAID
UNGU 17X30 1 BALL EMAL BHS UNPAID
PUTIH A 17X30 4 ROLL ODOY UNPAID
PINK 20X30 1 ROLL ODOY UNPAID
PUTIH A 17X30 6 ROLL ODOY UNPAID
HITAM 20x30 5 BALL ZAHRA UNPAID
PUTIH A 17X30 1 ROLL AZIS UNPAID
UNGU 15X25 5 ROLL AZIS UNPAID
HITAM 20X30 46 ROLL KOKO UNPAID
PUTIH A 17X30 7 ROLL ODOY UNPAID
PUTIH A 17X30 5 ROLL ODOY UNPAID
PUTIH B 15X25 20 ROLL PEDE UNPAID
PUTIH B 17X30 20 ROLL PEDE UNPAID
PUTIH B 20X30 20 ROLL PEDE UNPAID
100X150 1 DUS PEDE UNPAID
PUTIH A 17X30 5 ROLL ODOY UNPAID
KUNING 17X30 3 ROLL ODOY UNPAID
ORANGE 20X30 1 ROLL ODOY UNPAID
PUTIH A 17X30 2 ROLL ODOY UNPAID
KUNING 17X30 1 ROLL ODOY UNPAID
PUTIH B 15X25 1 ROLL ODOY UNPAID
PUTIH B 15X25 3 ROLL ODOY UNPAID
KUNING 17X30 5 ROLL ODOY UNPAID
HIJAU 20X30 2 ROLL ODOY UNPAID
PUTIH B 15X25 1 ROLL ODOY UNPAID
KUNING 17X30 4 ROLL ODOY UNPAID
ORANGE 20X30 1 ROLL ODOY UNPAID
PUTIH A 20X30 1 BALL ZAHRA UNPAID
PUTIH A 17X30 1 BALL ZAHRA UNPAID
PUTIH A 17X30 1 BALL SALMA ANGGA UNPAID
PUTIH A 20X30 1 BALL SALMA ANGGA UNPAID
100X150 2 DUS SALMA ANGGA UNPAID
KUNING 17X30 1 ROLL FAJAR UNPAID
PUTIH A 15X25 1 BALL SALMA ANGGA UNPAID
PUTIH A 20X30 1 BALL ZAHRA UNPAID
TOSCA 20X30 1 BALL WAWAN UNPAID
PUTIH A 15X25 1 BALL AGUS UNPAID
100X150 1 DUS AGUS UNPAID
100X150 15 DUS RN UNPAID
100X150 5 DUS RN UNPAID
PUTIH B 15X25 2 ROLL ODOY UNPAID
PUTIH B 17X30 4 ROLL ODOY UNPAID
PUTIH B 20X30 1 ROLL ODOY UNPAID
HITAM 25X35 1 ROLL KOKO UNPAID
HITAM 25X35 1 ROLL GALLERY ANNUR UNPAID
PUTIH B 17X30 5 ROLL AGUS UNPAID
"""

# Hardcode prices from SS Master (I'll extract prices from Excel)
# I don't have all the prices here... Let me read the Excel using pandas!
df = pd.read_excel('C:/Users/Administrator/Downloads/AUDIT_REKONSILIASI_RKN_OUTBOUND_vs_SS_MASTER_JUL-AUG_2026.xlsx', sheet_name='Master Harga', skiprows=3)

# Build price dict
price_dict = {}
for idx, row in df.iterrows():
    if pd.isna(row['Produk']): continue
    warna = str(row['Warna']).upper().strip()
    ukuran = str(row['Ukuran']).upper().strip()
    uom_bulk = str(row['UOM Bulk']).upper().strip()
    uom_eceran = str(row['Unit Eceran']).upper().strip()
    harga_bulk = int(str(row['Harga Bulk']).replace('Rp', '').replace(',', '').replace(' ', '')) if pd.notna(row['Harga Bulk']) else 0
    harga_eceran = int(str(row['Harga Unit']).replace('Rp', '').replace(',', '').replace(' ', '')) if pd.notna(row['Harga Unit']) else 0
    
    key_bulk = f"{warna} {ukuran} {uom_bulk}"
    key_eceran = f"{warna} {ukuran} {uom_eceran}"
    price_dict[key_bulk] = harga_bulk
    price_dict[key_eceran] = harga_eceran

price_dict['100X150 DUS'] = 800000 # Thermal Dus Panjang
price_dict['100X150 ROLL'] = 0

total = 0
not_found = []
for line in text.strip().split('\n'):
    parts = line.split()
    qty = int(parts[-4])
    uom = parts[-3].upper()
    warna = parts[0].upper()
    
    if "PUTIH A" in line.upper(): warna = "PUTIH A"
    if "PUTIH B" in line.upper(): warna = "PUTIH B"
    
    # size is either parts[1] or parts[2]
    if "X" in parts[1].upper(): ukuran = parts[1].upper()
    elif "X" in parts[2].upper(): ukuran = parts[2].upper()
    else: ukuran = parts[0]
    
    if "100X150" in line:
        key = f"100X150 {uom}"
    else:
        key = f"{warna} {ukuran} {uom}"
    
    if key in price_dict:
        total += qty * price_dict[key]
    else:
        not_found.append(line)

print("TOTAL MANUAL:", total)
if not_found:
    print("NOT FOUND:", not_found)
