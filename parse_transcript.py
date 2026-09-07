import json
with open('C:/Users/Administrator/.gemini/antigravity/brain/1b0ebbec-f648-4cdb-a1de-32366731aed5/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') == 1147:
            print(data.get('content').encode('ascii', 'ignore').decode('ascii'))
