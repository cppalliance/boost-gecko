from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from .crawler import Crawler
from .helpers import has_class


class BoostJson(Crawler):
    def crawl(self, library_key: str) -> dict:
        assert library_key == 'json'

        index_path = self._boost_root / 'libs' / library_key / 'doc/html'

        sections = {}
        for file_path in Path(index_path).parent.rglob('*.html'):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                soup = BeautifulSoup(file.read(), 'html.parser')
                if 'ref' in file_path.parts :
                    self._extract_reference(str(file_path), sections, soup.select_one('body div.boostlook'))
                else :
                    for sect1 in soup.select('body div[id="content"] > .sect1'):
                        self._extract_section_n(str(file_path), sections, sect1)

        return sections

    def _extract_reference(self, index_path: str, sections: dict, boostlook: Tag):
        lvls = []
        for link in boostlook.select('nav[id="breadcrumbs"] ul li:not(:first-child) > a'):
            lvls = lvls + [{'title': link.text.split("::")[-1], 'path':  urljoin(index_path, link.get('href'))}]

        header = boostlook.select_one('h1, h2, h3, h4, h5, h6')
        path = lvls[-1]['path']

        if header.find_next_sibling() and has_class(header.find_next_sibling(), 'sectionbody'):
            siblings = header.find_next_sibling().find_all(recursive=False)
        else:
            siblings = header.next_siblings

        content = ''
        for sibling in siblings:
            if isinstance(sibling, Tag) and sibling.has_attr('class') and len([i for i in sibling.get('class') if i.startswith('sect')]) > 0:
                self._extract_section_n(index_path, sections, sibling, lvls)
                continue
            content += sibling.get_text() + ' '

        sections[path] = {'content': content, 'lvls': lvls}


    def _extract_section_n(self, index_path: str, sections: dict, sect: Tag, lvls: list = []):
        header = sect.select_one('h1, h2, h3, h4, h5, h6')
        title = header.text
        path = index_path + '#' + header.get('id')
        lvls = lvls + [{'title': title, 'path': path}]

        if header.find_next_sibling() and has_class(header.find_next_sibling(), 'sectionbody'):
            siblings = header.find_next_sibling().find_all(recursive=False)
        else:
            siblings = header.next_siblings

        content = ''
        for sibling in siblings:
            if isinstance(sibling, Tag) and sibling.has_attr('class') and len([i for i in sibling.get('class') if i.startswith('sect')]) > 0:
                self._extract_section_n(index_path, sections, sibling, lvls)
                continue
            content += sibling.get_text() + ' '

        sections[path] = {'content': content, 'lvls': lvls}
