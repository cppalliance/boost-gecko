import React from 'react';
import PropTypes from 'prop-types';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import Typography from '@mui/material/Typography';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

import RecentSearches from 'recent-searches';

import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { InstantSearch, Index, Configure } from 'react-instantsearch';

import SearchBox from './SearchBox';
import InfiniteHits from './InfiniteHits';
import './search-modal.css';
import PoweredByFooterBrand from './PoweredByFooterBrand';

const FOCUS = Object.freeze({
  INPUT: 'input',
  SHOW_MORE: 'show-more',
});

function SearchDialog({
  themeMode,
  fontFamily,
  versionWarning,
  library,
  onLearnPages,
  librariesUrlPrefix,
  learnUrlPrefix,
  librariesAlgoliaIndex,
  learnAlgoliaIndex,
  alogliaAppId,
  alogliaApiKey,
}) {
  const [searchClient] = React.useState(() => {
    const algoliaClient = algoliasearch(alogliaAppId, alogliaApiKey);
    // Prevents empty search query
    return {
      ...algoliaClient,
      search(requests) {
        if (requests.every(({ params }) => !params.query)) {
          return Promise.resolve({
            results: requests.map(() => ({
              hits: [],
              nbHits: 0,
              nbPages: 0,
              page: 0,
              processingTimeMS: 0,
              hitsPerPage: 0,
              exhaustiveNbHits: false,
              query: '',
              params: '',
            })),
          });
        }

        return algoliaClient.search(requests);
      },
    };
  });

  const [recentSearches, setRecentSearches] = React.useState(null);

  React.useEffect(() => {
    if (library) setRecentSearches(new RecentSearches({ namespace: 'rs-' + library.key }));
    else setRecentSearches(new RecentSearches({ namespace: 'rs-main-page' }));
  }, [library]);

  const [selectedTab, setSelectedTab] = React.useState(onLearnPages ? '2' : '1');

  const [nbHits1, setnbHits1] = React.useState(0);
  const [nbHits2, setnbHits2] = React.useState(0);
  const [hasQuery, setHasQuery] = React.useState(false);
  const [activeResultIndex, setActiveResultIndex] = React.useState(FOCUS.INPUT);
  const kFormatter = (num) => (num > 999 ? (num / 1000).toFixed(1) + 'k' : num);

  const handleTabChange = React.useCallback((event, newValue) => {
    setSelectedTab(newValue);
    setActiveResultIndex(FOCUS.INPUT);
  }, []);

  const [dialogOpen, setDialogOpen] = React.useState(window.location.hash === '#search-dialog');
  const [keepDialogMounted, setKeepDialogMounted] = React.useState(false);

  React.useEffect(() => {
    const onHashChange = () => setDialogOpen(window.location.hash === '#search-dialog');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleDialogClose = React.useCallback(() => window.history.back(), []);

  React.useEffect(() => {
    const html = document.documentElement;
    if (themeMode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [themeMode]);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: themeMode === 'dark' ? '#7DD3FC' : '#0284C7',
          },
          ...(themeMode === 'dark' && {
            background: {
              paper: '#172A34',
            },
          }),
        },
        typography: {
          allVariants: { ...(fontFamily && { fontFamily }) },
        },
      }),
    [themeMode, fontFamily],
  );

  const dialogShouldBeFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const inputRef = React.useRef(null);
  // Stores the element that opened the dialog so we can restore focus to it on close.
  // Uses document.activeElement (a browser API) rather than element IDs or component
  // references, so it remains reliable after minification or when exported elsewhere.
  const triggerRef = React.useRef(null);

  const handleDialogOpen = React.useCallback(() => {
    triggerRef.current = document.activeElement;
    window.location.hash = '#search-dialog';
    setKeepDialogMounted(true);
    setTimeout(() => {
      inputRef.current.focus();
    }, 0);
  }, [inputRef]);

  React.useEffect(() => {
    if (!dialogOpen && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [dialogOpen]);

  React.useEffect(() => {
    const searchButton = document.getElementById('gecko-search-button');
    searchButton.addEventListener('click', handleDialogOpen);
    return () => searchButton.removeEventListener('click', handleDialogOpen);
  }, [handleDialogOpen]);

  const setRecentSearch = React.useCallback(
    () => recentSearches.setRecentSearch(inputRef.current.value),
    [recentSearches, inputRef],
  );

  const handleDialogKeyDown = React.useCallback(
    (event) => {
      const { key } = event;

      const panel = document.querySelector('.search-modal__tab-panel:not([hidden])');
      const options = panel ? panel.querySelectorAll('[role="option"]') : [];
      const count = options.length;

      if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Enter') return;

      // Let the Autocomplete handle arrows when its dropdown is open.
      const autocompleteOpen = document.querySelector('.search-modal__root .MuiAutocomplete-popper');
      if (autocompleteOpen && (key === 'ArrowDown' || key === 'ArrowUp')) return;

      const showMoreBtn = panel?.querySelector('.search-modal__show-more:not([disabled])');

      if (key === 'ArrowDown') {
        event.preventDefault();
        setActiveResultIndex((prev) => {
          if (count === 0) return FOCUS.INPUT;
          if (prev === FOCUS.INPUT) return 0;
          if (prev === FOCUS.SHOW_MORE) return FOCUS.INPUT;
          if (prev >= count - 1) return showMoreBtn ? FOCUS.SHOW_MORE : FOCUS.INPUT;
          return prev + 1;
        });
      } else if (key === 'ArrowUp') {
        event.preventDefault();
        setActiveResultIndex((prev) => {
          if (prev === FOCUS.INPUT) return FOCUS.INPUT;
          if (prev === FOCUS.SHOW_MORE) return count - 1;
          return prev === 0 ? FOCUS.INPUT : prev - 1;
        });
      } else if (key === 'Enter' && typeof activeResultIndex === 'number') {
        event.preventDefault();
        const activeOption = options[activeResultIndex];
        const link = activeOption?.querySelector('.search-modal__hit-link');
        if (link) {
          setRecentSearch();
          link.click();
        }
      }
    },
    [activeResultIndex, setRecentSearch],
  );

  // Move real DOM focus and scroll the active element into view.
  React.useEffect(() => {
    if (activeResultIndex === FOCUS.INPUT) {
      inputRef.current?.focus();
    } else if (activeResultIndex === FOCUS.SHOW_MORE) {
      const panel = document.querySelector('.search-modal__tab-panel:not([hidden])');
      const btn = panel?.querySelector('.search-modal__show-more:not([disabled])');
      if (btn) {
        btn.focus({ preventScroll: true });
        btn.scrollIntoView({ block: 'nearest' });
      }
    } else {
      const panel = document.querySelector('.search-modal__tab-panel:not([hidden])');
      const options = panel?.querySelectorAll('[role="option"]');
      const el = options?.[activeResultIndex];
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeResultIndex]);

  // Reset active result when query changes.
  const handleQueryChange = React.useCallback((hasValue) => {
    setHasQuery(hasValue);
    setActiveResultIndex(FOCUS.INPUT);
  }, []);

  return (
    <StyledEngineProvider injectFirst>
      <InstantSearch searchClient={searchClient} future={{ preserveSharedStateOnUnmount: true }}>
        <ThemeProvider theme={theme}>
          <Dialog
            fullScreen={dialogShouldBeFullScreen}
            keepMounted={keepDialogMounted}
            fullWidth
            maxWidth='md'
            open={dialogOpen}
            onClose={handleDialogClose}
            onKeyDown={handleDialogKeyDown}
            aria-label='Search documentation'
            slotProps={{
              backdrop: { className: 'search-modal__backdrop' },
              container: { className: 'search-modal__container' },
              paper: {
                className: `search-modal__dialog${dialogShouldBeFullScreen ? ' search-modal__dialog--fullscreen' : ''}`,
              },
            }}
            className='search-modal__root'
          >
            <DialogTitle className='search-modal__title'>
              <Grid container className='search-modal__title-grid' spacing={1}>
                <Grid size='grow'>
                  <SearchBox
                    inputRef={inputRef}
                    recentSearches={inputRef.current ? recentSearches.getRecentSearches(inputRef.current.value) : []}
                    onQueryChange={handleQueryChange}
                  />
                </Grid>
                <Grid>
                  <Button
                    className='search-modal__esc-button'
                    onClick={handleDialogClose}
                    size='small'
                    variant='outlined'
                    aria-label='Close search dialog'
                  >
                    <CloseIcon fontSize='inherit' aria-hidden='true' />
                    Esc
                  </Button>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  {versionWarning && (
                    <Typography className='search-modal__tip' variant='caption'>
                      <Box className='search-modal__tip-label' component='span'>
                        Note:
                      </Box>{' '}
                      search limited to the latest version of documentation.
                    </Typography>
                  )}
                  {!library ? (
                    <>
                      <Typography className='search-modal__tip' variant='caption'>
                        <Box className='search-modal__tip-label' component='span'>
                          Tip:
                        </Box>{' '}
                        limit the search scope by navigating to a library page.
                      </Typography>
                      <Tabs
                        className='search-modal__tabs'
                        value={selectedTab}
                        onChange={handleTabChange}
                        variant='fullWidth'
                        aria-label='Search categories'
                      >
                        <Tab
                          className='search-modal__tab'
                          id='search-tab-1'
                          aria-controls='search-tabpanel-1'
                          value='1'
                          label={<>Libraries {hasQuery && nbHits1 > 0 ? <span>({kFormatter(nbHits1)})</span> : null}</>}
                        />
                        <Tab
                          className='search-modal__tab'
                          id='search-tab-2'
                          aria-controls='search-tabpanel-2'
                          value='2'
                          label={<>Learn {hasQuery && nbHits2 > 0 ? <span>({kFormatter(nbHits2)})</span> : null}</>}
                        />
                      </Tabs>
                    </>
                  ) : (
                    <Tabs
                      className='search-modal__tabs'
                      value={selectedTab}
                      onChange={handleTabChange}
                      variant='fullWidth'
                      aria-label='Search categories'
                    >
                      <Tab
                        className='search-modal__tab'
                        id='search-tab-1'
                        aria-controls='search-tabpanel-1'
                        value='1'
                        label={
                          <>
                            {library.name} {hasQuery && nbHits1 > 0 ? <span>({kFormatter(nbHits1)})</span> : null}
                          </>
                        }
                      />
                      <Tab
                        className='search-modal__tab'
                        id='search-tab-2'
                        aria-controls='search-tabpanel-2'
                        value='2'
                        label={
                          <>Other Libraries {hasQuery && nbHits2 > 0 ? <span>({kFormatter(nbHits2)})</span> : null}</>
                        }
                      />
                    </Tabs>
                  )}
                </Grid>
              </Grid>
            </DialogTitle>
            <DialogContent className='search-modal__content'>
              {!library ? (
                <>
                  <Box
                    className='search-modal__tab-panel'
                    role='tabpanel'
                    id='search-tabpanel-1'
                    aria-labelledby='search-tab-1'
                    hidden={selectedTab !== '1'}
                  >
                    <Index indexName={librariesAlgoliaIndex}>
                      <Configure hitsPerPage={30} />
                      <InfiniteHits
                        urlPrefix={librariesUrlPrefix}
                        setnbHits={setnbHits1}
                        onClick={setRecentSearch}
                        showLibName
                        hasQuery={hasQuery}
                        activeResultIndex={selectedTab === '1' ? activeResultIndex : FOCUS.INPUT}
                      />
                    </Index>
                  </Box>
                  <Box
                    className='search-modal__tab-panel'
                    role='tabpanel'
                    id='search-tabpanel-2'
                    aria-labelledby='search-tab-2'
                    hidden={selectedTab !== '2'}
                  >
                    <Index indexName={learnAlgoliaIndex}>
                      <Configure hitsPerPage={30} />
                      <InfiniteHits
                        urlPrefix={learnUrlPrefix}
                        setnbHits={setnbHits2}
                        onClick={setRecentSearch}
                        hasQuery={hasQuery}
                        activeResultIndex={selectedTab === '2' ? activeResultIndex : FOCUS.INPUT}
                      />
                    </Index>
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    className='search-modal__tab-panel'
                    role='tabpanel'
                    id='search-tabpanel-1'
                    aria-labelledby='search-tab-1'
                    hidden={selectedTab !== '1'}
                  >
                    <Index indexName={librariesAlgoliaIndex}>
                      <Configure hitsPerPage={30} filters={'library_key:' + library.key} />
                      <InfiniteHits
                        urlPrefix={librariesUrlPrefix}
                        setnbHits={setnbHits1}
                        onClick={setRecentSearch}
                        hasQuery={hasQuery}
                        activeResultIndex={selectedTab === '1' ? activeResultIndex : FOCUS.INPUT}
                      />
                    </Index>
                  </Box>
                  <Box
                    className='search-modal__tab-panel'
                    role='tabpanel'
                    id='search-tabpanel-2'
                    aria-labelledby='search-tab-2'
                    hidden={selectedTab !== '2'}
                  >
                    <Index indexName={librariesAlgoliaIndex}>
                      <Configure hitsPerPage={30} filters={'NOT library_key:' + library.key} />
                      <InfiniteHits
                        urlPrefix={librariesUrlPrefix}
                        setnbHits={setnbHits2}
                        onClick={setRecentSearch}
                        showLibName
                        hasQuery={hasQuery}
                        activeResultIndex={selectedTab === '2' ? activeResultIndex : FOCUS.INPUT}
                      />
                    </Index>
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions className='search-modal__footer'>
              <div className='search-modal__footer-grid'>
                <div className='search-modal__footer-cell search-modal__footer-cell--label'>
                  <PoweredByFooterBrand />
                </div>
                <div className='search-modal__footer-cell'>
                  <a
                    className='search-modal__report-link'
                    href='https://github.com/cppalliance/boost-gecko/issues'
                    target='_blank'
                    rel='noreferrer noopener'
                  >
                    Report Issue
                  </a>
                </div>
              </div>
            </DialogActions>
          </Dialog>
        </ThemeProvider>
      </InstantSearch>
    </StyledEngineProvider>
  );
}

SearchDialog.propTypes = {
  themeMode: PropTypes.string.isRequired,
  fontFamily: PropTypes.string,
  versionWarning: PropTypes.bool.isRequired,
  library: PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onLearnPages: PropTypes.bool.isRequired,
  librariesUrlPrefix: PropTypes.string.isRequired,
  learnUrlPrefix: PropTypes.string.isRequired,
  librariesAlgoliaIndex: PropTypes.string.isRequired,
  learnAlgoliaIndex: PropTypes.string.isRequired,
  alogliaAppId: PropTypes.string.isRequired,
  alogliaApiKey: PropTypes.string.isRequired,
};

export default SearchDialog;
