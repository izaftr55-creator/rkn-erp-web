import os
import json
import urllib.request

def run():
    with open('.env.local', 'r') as f:
        env = dict(line.strip().split('=', 1) for line in f if '=' in line)
    
    account_id = env.get('CLOUDFLARE_ACCOUNT_ID', '').strip('"\'')
    api_token = env.get('CLOUDFLARE_API_TOKEN', '').strip('"\'')
    db_id = env.get('CLOUDFLARE_DATABASE_ID', '').strip('"\'')

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{db_id}/query"
    
    sql = "SELECT i.customer_name, SUM(i.grand_total_rp - COALESCE(p.paid_amount, 0)) as piutang FROM plastic_sales_invoice i LEFT JOIN (SELECT invoice_id, SUM(amount_rp) as paid_amount FROM plastic_payment WHERE business_unit_id='BU-PLASTIC' AND status='POSTED' GROUP BY invoice_id) p ON i.invoice_id = p.invoice_id WHERE i.business_unit_id='BU-PLASTIC' AND i.status != 'VOID' GROUP BY i.customer_name HAVING piutang > 0 ORDER BY piutang DESC"
    
    req = urllib.request.Request(url, method='POST')
    req.add_header('Authorization', f'Bearer {api_token}')
    req.add_header('Content-Type', 'application/json')
    data = json.dumps({"sql": sql}).encode('utf-8')
    
    try:
        with urllib.request.urlopen(req, data=data) as response:
            res = json.loads(response.read().decode())
            print(json.dumps(res['result'][0]['results'], indent=2))
    except Exception as e:
        print(e)

run()
