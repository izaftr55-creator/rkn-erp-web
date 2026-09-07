import pandas as pd
import json

df = pd.read_excel('C:/Users/Administrator/Downloads/AUDIT_REKONSILIASI_RKN_OUTBOUND_vs_SS_MASTER_JUL-AUG_2026.xlsx', sheet_name='Temuan Selisih', skiprows=3)

# We need the invoice numbers and the correct prices.
# The API payload for UPDATE_SALE needs all lines.
# But wait, to UPDATE_SALE we need the invoiceId, not invoiceNo.
