import React from 'react';
import PropTypes from 'prop-types';

import urlJoin from 'url-join';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { useTheme } from '@mui/material/styles';

import { useInfiniteHits, useInstantSearch, useStats, Snippet } from 'react-instantsearch';

function CustomHit({ hit, index, activeResultIndex, urlPrefix, onClick, showLibName }) {
  const theme = useTheme();
  const { library_key, library_name, hierarchy, _highlightResult } = hit;

  const hierarchyKeys = _highlightResult ? Object.keys(_highlightResult.hierarchy) : [];

  const primaryHref = React.useMemo(() => {
    const lastKey = hierarchyKeys[hierarchyKeys.length - 1];
    return lastKey ? urlJoin(urlPrefix, hierarchy[lastKey].path) : urlJoin(urlPrefix, 'libs', library_key);
  }, [urlPrefix, hierarchy, hierarchyKeys, library_key]);

  const hierarchyLinks = React.useMemo(() => {
    if (!_highlightResult) return [];
    return hierarchyKeys.map((key, i) => (
      <Link
        underline='hover'
        dangerouslySetInnerHTML={{
          __html: _highlightResult.hierarchy[key].title.value,
        }}
        key={hierarchy[key].path}
        onClick={onClick}
        onAuxClick={onClick}
        href={urlJoin(urlPrefix, hierarchy[key].path)}
        {...(i === hierarchyKeys.length - 1 && { 'aria-current': 'page' })}
      ></Link>
    ));
  }, [urlPrefix, onClick, hierarchy, _highlightResult, hierarchyKeys]);

  const hitLabel = React.useMemo(() => {
    const parts = [];
    if (showLibName || hierarchyKeys.length === 0) parts.push(library_name);
    if (_highlightResult) {
      for (const key of hierarchyKeys) {
        // Strip HTML highlight tags to get plain text for the aria-label.
        const plain = _highlightResult.hierarchy[key].title.value.replace(/<[^>]+>/g, '');
        if (plain) parts.push(plain);
      }
    }
    return parts.join(' > ');
  }, [showLibName, library_name, hierarchyKeys, _highlightResult]);

  return (
    <Box
      className='search-modal__hit'
      role='option'
      id={`search-result-${index}`}
      aria-selected={index === activeResultIndex}
      aria-label={hitLabel}
      tabIndex={-1}
    >
      {/* Stretched link makes the entire card clickable, pointing to the deepest hierarchy entry.
         Breadcrumb links sit above it (via z-index) so they remain individually clickable. */}
      <a
        className='search-modal__hit-link'
        href={primaryHref}
        onClick={onClick}
        onAuxClick={onClick}
        tabIndex={-1}
        aria-hidden='true'
      />
      <Breadcrumbs className='search-modal__breadcrumbs' separator='&gt;' aria-label='Breadcrumb'>
        {(showLibName || hierarchyLinks.length === 0) && (
          <Link
            underline='hover'
            href={urlJoin(urlPrefix, 'libs', library_key)}
            className='search-modal__breakcrumbs-link'
          >
            {library_name}
          </Link>
        )}
        {hierarchyLinks}
      </Breadcrumbs>
      <p
        className='search-modal__snippet-wrapper'
        aria-label={hit._snippetResult?.content?.value?.replace(/<[^>]+>/g, '') || ''}
      >
        <Snippet classNames={{ root: 'search-modal__snippet' }} hit={hit} attribute='content' />
      </p>
    </Box>
  );
}

CustomHit.propTypes = {
  hit: PropTypes.object.isRequired,
  urlPrefix: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  showLibName: PropTypes.bool,
};

function InfiniteHits({ urlPrefix, setnbHits, onClick, showLibName, hasQuery, activeResultIndex }) {
  const { hits, isLastPage, showMore } = useInfiniteHits();
  const { addMiddlewares, status } = useInstantSearch();
  const [error, setError] = React.useState(null);
  const { nbHits } = useStats();

  React.useEffect(() => {
    setnbHits(nbHits);
  }, [nbHits, setnbHits]);

  React.useEffect(() => {
    const middleware = ({ instantSearchInstance }) => {
      function handleError(searchError) {
        setError(searchError);
      }
      return {
        subscribe() {
          instantSearchInstance.addListener('error', handleError);
        },
        unsubscribe() {
          instantSearchInstance.removeListener('error', handleError);
        },
      };
    };

    return addMiddlewares(middleware);
  }, [addMiddlewares]);

  const memoizedHits = React.useMemo(
    () =>
      hits.map((hit, index) => (
        <CustomHit
          key={hit.objectID}
          hit={hit}
          index={index}
          activeResultIndex={activeResultIndex}
          urlPrefix={urlPrefix}
          onClick={onClick}
          showLibName={showLibName}
        />
      )),
    [hits, urlPrefix, onClick, showLibName, activeResultIndex],
  );

  if (error) {
    return (
      <Alert severity='error'>
        <AlertTitle>{error.name}</AlertTitle>
        {error.message}
      </Alert>
    );
  }

  if (hits.length === 0 && !hasQuery) {
    return (
      <div className='search-modal__empty-state'>
        <h2 className='search-modal__empty-state-title'>Ready when you are</h2>
        <p className='search-modal__empty-state-subtitle'>
          Your search results will appear here once you start typing.
        </p>
      </div>
    );
  }

  if (hits.length === 0 && hasQuery) {
    return (
      <div className='search-modal__no-results'>
        <h2 className='search-modal__no-results-title'>No Results Found</h2>
        <p className='search-modal__no-results-subtitle'>Sorry, We couldn&apos;t find any matches for your search.</p>
      </div>
    );
  }

  return (
    <Stack
      className='search-modal__hits-stack'
      spacing={2}
      role='listbox'
      aria-label='Search results'
      aria-busy={status === 'loading' || status === 'stalled'}
    >
      {memoizedHits}
      <Box className='search-modal__show-more-wrapper' textAlign='center'>
        <Button className='search-modal__show-more' disabled={isLastPage} onClick={showMore}>
          Show More
        </Button>
      </Box>
    </Stack>
  );
}

InfiniteHits.propTypes = {
  urlPrefix: PropTypes.string.isRequired,
  setnbHits: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  showLibName: PropTypes.bool,
  hasQuery: PropTypes.bool.isRequired,
  activeResultIndex: PropTypes.number.isRequired,
};

export default InfiniteHits;
