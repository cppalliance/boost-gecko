import React from 'react';
import ReactDOM from 'react-dom/client';

import Demo from './Demo';
import Search from './Search';
import { libraries } from './libraries';

const searchDemo = document.querySelector('#search-demo-react-root');

if (searchDemo) {
  ReactDOM.createRoot(searchDemo).render(
    <React.StrictMode>
      <Demo />
    </React.StrictMode>,
  );
} else {
  let url = window.location.href;
  const urlPrefix = 'https://www.boost.org/doc/libs/1_82_0/';

  if (!url.startsWith(urlPrefix)) throw new Error(`Cannot find prefix of ${urlPrefix} in the URL.`);

  url = url.replace(urlPrefix, '');
  url = url.replace('doc/html/boost_', '');
  url = url.replace('doc/html/boost/', '');
  url = url.replace('doc/html/', '');
  url = url.replace('libs/', '');

  let library = undefined;

  // First we try to match libraries like functional/factory and numeric/odeint
  const match = url.match(/([^/]+\/[^/]+)\//);
  if (match && match[1])
    library = libraries.filter((i) => i.key === match[1] || i.key.replace('_', '') === match[1])[0];

  if (!library) {
    const match = url.match(/^(.*?)(?:\.|\/)/);

    if (!match || !match[1]) throw new Error(`Cannot extract library_key from the URL.`);

    library = libraries.filter((i) => i.key === match[1] || i.key.replace('_', '') === match[1])[0];
  }

  if (!library) throw new Error(`Cannot find a library with such key: ${match[1]}.`);

  const addCSS = (css) => (document.head.appendChild(document.createElement('style')).innerHTML = css);

  const div = Object.assign(document.createElement('div'), { id: 'search-button-react-root' });

  // Workaround for gil and hana that have searchbox in their pages
  if (library.key === 'gil' || library.key === 'hana') {
    let searchBox = document.querySelector('#searchbox, #MSearchBox');
    addCSS('#search-button-react-root {float: right; width: 120px; padding-right: 18px;}');
    searchBox.replaceChildren(div);
    // Workaround for spirit/classic and wave headers
  } else if (library.key === 'spirit/classic' || library.key === 'wave') {
    let td = document.querySelector('body > table:first-of-type td:nth-child(2)');
    addCSS('#search-button-react-root {float: right; width: 120px;}');
    td.append(div);
  } else {
    const heading = document.querySelector('#boost-common-heading-doc .heading-inner, #heading .heading-inner');
    if (heading) {
      addCSS('#search-button-react-root {float: right; width: 100px; padding-right: 18px;}');
      addCSS('@media (max-device-width: 480px) {#search-button-react-root {padding-top: 18px;}}');
      addCSS('#search-button-react-root * {color: #1976d2;}');
      addCSS('#search-button-react-root button {background-color: #FFF;}');
      heading.appendChild(div);
    } else {
      addCSS('#search-button-react-root button {background-color: #FFF;}');
      addCSS('#search-button-react-root {width: 120px; top: 10px; right: 10px; position: absolute;}');
      document.body.prepend(div);
    }
  }

  ReactDOM.createRoot(div).render(
    <React.StrictMode>
      <Search
        library={library}
        urlPrefix={'https://www.boost.org/doc/libs/1_82_0'}
        algoliaIndex={'1_82_0'}
        alogliaAppId={'D7O1MLLTAF'}
        alogliaApiKey={'44d0c0aac3c738bebb622150d1ec4ebf'}
      />
    </React.StrictMode>,
  );
}
