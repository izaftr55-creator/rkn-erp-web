import pandas as pd
import json

df = pd.read_excel('C:/Users/Administrator/Downloads/AUDIT_REKONSILIASI_RKN_OUTBOUND_vs_SS_MASTER_JUL-AUG_2026.xlsx', sheet_name='Temuan Selisih', skiprows=3)
invoices = df['No. Invoice'].unique().tolist()
print(json.dumps(invoices))
