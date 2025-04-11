import json
from pathlib import Path

if __name__ == "__main__":
    libraries = []

    for path in Path('../algolia_records/libraries').glob('*.json'):
        with open(path, 'r', encoding='utf-8') as f:
            records = json.load(f)
            libraries.append({'key': records[0]['library_key'], 'name': records[0]['library_name']})

    libraries = sorted(libraries, key=lambda l: l['name']) 

    with open('./libraries.json', 'w', encoding='utf-8') as outfile:
            json.dump(libraries, outfile, indent=4)
