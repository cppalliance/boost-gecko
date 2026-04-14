"""Checks the sanity of generated Algolia records
Usage:
    sanitizer check
    sanitizer update-config
    sanitizer -h
"""
import re
import json
import sys
from pathlib import Path
from docopt import docopt

from .config import config, update_config_file


def check_for_abnormality(nbof: str, name: str, prev: int, curr: int):
    if prev == 0:
        return curr != 0
    if (abs(curr - prev) / prev) > 0.2:
        print('Error: Abnormal change in number of {} in {} from:{} to:{}'.format(nbof, name, prev,  curr))
        return True
    return False


def check(cfg:dict, json_file_path: Path):
    failed = False
    with open(json_file_path, 'r', encoding='utf-8') as f:
        records = json.load(f)
        words = 0
        lvls = 0
        for record in records:
            words += len(re.findall(r'\w+', record['content']))
            lvls += len([l for l in record['hierarchy'].values() if l is not None])

        failed |= check_for_abnormality(
            nbof='records',
            name=cfg['key'],
            prev=cfg['last-records'],
            curr=len(records))

        failed |= check_for_abnormality(
            nbof='words',
            name=cfg['key'],
            prev=cfg['last-words'],
            curr=words)

        failed |= check_for_abnormality(
            nbof='lvls',
            name=cfg['key'],
            prev=cfg['last-lvls'],
            curr=lvls)

    return failed


def update_config(cfg:dict, json_file_path: Path):
    with open(json_file_path, 'r', encoding='utf-8') as f:
        records = json.load(f)
        cfg['last-records'] = len(records)
        cfg['last-words'] = 0
        cfg['last-lvls'] = 0
        for record in records:
            cfg['last-words'] += len(re.findall(r'\w+', record['content']))
            cfg['last-lvls'] += len([l for l in record['hierarchy'].values() if l is not None])


if __name__ == "__main__":
    args = docopt(__doc__)

    if args['check']:
        failed = False
        for crawler_cfg in config['crawlers']:
            for library_cfg in crawler_cfg['libraries']:
                json_file_path = Path('./algolia_records/libraries') / f"{library_cfg['key'].replace('/','_')}.json"
                failed |= check(library_cfg, json_file_path)

        for section_cfg in config['website-v2-docs']['sections']:
            json_file_path = Path('./algolia_records/learn') / f"{section_cfg['key']}.json"
            failed |= check(section_cfg, json_file_path)

        if failed:
            sys.exit(1)

    if args['update-config']:
        for crawler_cfg in config['crawlers']:
            for library_cfg in crawler_cfg['libraries']:
                json_file_path = Path('./algolia_records/libraries') / f"{library_cfg['key'].replace('/','_')}.json"
                update_config(library_cfg, json_file_path)

        for section_cfg in config['website-v2-docs']['sections']:
            json_file_path = Path('./algolia_records/learn') / f"{section_cfg['key']}.json"
            update_config(section_cfg, json_file_path)

        update_config_file()
        print('Config has been updated.')
