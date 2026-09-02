import sqlite3

con = sqlite3.connect('.wrangler/state/v3/do/rkn-erp-prod-RknErpCore/metadata.sqlite')
cursor = con.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", tables)

for t in tables:
    table_name = t[0]
    print(f"\n--- Table: {table_name} ---")
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
    rows = cursor.fetchall()
    for r in rows:
        print(r)
