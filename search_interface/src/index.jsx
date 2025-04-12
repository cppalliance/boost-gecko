import React from 'react';
import ReactDOM from 'react-dom/client';

import Demo from './Demo';
import SearchDialog from './Search/SearchDialog';
import { libraries } from './libraries';

const searchDemo = document.querySelector('#search-demo-react-root');

if (searchDemo) {
  ReactDOM.createRoot(searchDemo).render(
    <React.StrictMode>
      <Demo />
    </React.StrictMode>,
  );
} else {
  const { onLearnPages, boostVersion, library } = parseURL();

  const rootElement = document.createElement('div');
  const root = ReactDOM.createRoot(rootElement);
  const searchButton = document.getElementById('gecko-search-button');

  const renderRoot = () => {
    const currentBoostVersion = searchButton.getAttribute('data-current-boost-version').replaceAll('.', '_');
    const themeMode = searchButton.getAttribute('data-theme-mode');
    const fontFamily = searchButton.getAttribute('data-font-family');
    root.render(
      <React.StrictMode>
        <SearchDialog
          themeMode={themeMode}
          fontFamily={fontFamily}
          versionWarning={!!boostVersion && boostVersion !== currentBoostVersion && boostVersion !== 'latest'}
          library={library}
          onLearnPages={onLearnPages}
          librariesUrlPrefix={window.location.origin + '/doc/libs/latest'}
          learnUrlPrefix={window.location.origin + '/doc/'}
          librariesAlgoliaIndex={currentBoostVersion}
          learnAlgoliaIndex={'learn'}
          alogliaAppId={'D7O1MLLTAF'}
          alogliaApiKey={'44d0c0aac3c738bebb622150d1ec4ebf'}
        />
      </React.StrictMode>,
    );
  };

  renderRoot();

  // Rerender root on any change to the attributes (E.g. data-theme-mode)
  const observer = new MutationObserver(renderRoot);
  observer.observe(document.getElementById('gecko-search-button'), { attributes: true });
}

function parseURL() {
  let onLearnPages = false;
  let library = undefined;
  let boostVersion = undefined;
  let path = window.location.pathname;

  path = path.replace('/library/latest', '/doc/libs/latest');

  const librariesPathPrefix = '/doc/libs/';
  if (!path.startsWith(librariesPathPrefix)) {
    const learnPathPrefixes = ['/docs/', '/doc/user-guide/', '/doc/formal-reviews/', '/doc/contributor-guide/'];
    if (learnPathPrefixes.some((str) => path.startsWith(str))) onLearnPages = true;
    return { onLearnPages, boostVersion, library };
  }
  path = path.replace(librariesPathPrefix, '');

  {
    const match = path.match(/^(.*?)\//);
    if (!match || !match[1]) return { onLearnPages, boostVersion, library };
    boostVersion = match[1];
  }

  path = path.replace(boostVersion + '/', '');
  path = path.replace('doc/antora/', '');
  path = path.replace('doc/html/boost_', '');
  path = path.replace('doc/html/boost/', '');
  path = path.replace('doc/html/', '');
  path = path.replace('libs/', '');

  // First we try to match libraries like functional/factory and numeric/odeint
  const match = path.match(/([^/]+\/[^/]+)\//);
  if (match && match[1])
    library = libraries.filter((i) => i.key === match[1] || i.key.replace('_', '') === match[1])[0];

  if (!library) {
    const match = path.match(/^(.*?)(?:\.|\/)/);
    if (match && match[1])
      library = libraries.filter((i) => i.key === match[1] || i.key.replace('_', '') === match[1])[0];
  }

  if (!library) {
    const match = path.match(/BOOST_([^_]+)/);
    if (match && match[1]) library = libraries.filter((i) => i.key === match[1].toLowerCase())[0];
  }

  boostVersion = boostVersion.replace('boost_', '');

  return { onLearnPages, boostVersion, library };
}
