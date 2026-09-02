import sqlite3

con = sqlite3.connect('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/68709b1b6a7c6f6b78ce431fa265d9999462c5503c83a2f771ad157e77271de9.sqlite')
cursor = con.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

for t in tables:
    table_name = t[0]
    if table_name.startswith('_cf'): continue
    print(f"\n--- Table: {table_name} ---")
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
    rows = cursor.fetchall()
    for r in rows:
        print(r)
