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
  const kFormatter = (num) => (num > 999 ? (num / 1000).toFixed(1) + 'k' : num);

  const handleTabChange = React.useCallback((event, newValue) => setSelectedTab(newValue), []);

  const [dialogOpen, setDialogOpen] = React.useState(window.location.hash === '#search-dialog');
  const [keepDialogMounted, setKeepDialogMounted] = React.useState(false);

  React.useEffect(() => {
    const onHashChange = () => setDialogOpen(window.location.hash === '#search-dialog');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleDialogClose = React.useCallback(() => window.history.back(), []);

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

  const handleDialogOpen = React.useCallback(() => {
    window.location.hash = '#search-dialog';
    setKeepDialogMounted(true);
    setTimeout(() => {
      inputRef.current.focus();
    }, 0);
  }, [inputRef]);

  React.useEffect(() => {
    const searchButton = document.getElementById('gecko-search-button');
    searchButton.addEventListener('click', handleDialogOpen);
    return () => searchButton.removeEventListener('click', handleDialogOpen);
  }, [handleDialogOpen]);

  const setRecentSearch = React.useCallback(
    () => recentSearches.setRecentSearch(inputRef.current.value),
    [recentSearches, inputRef],
  );

  return (
    <StyledEngineProvider injectFirst>
      <InstantSearch searchClient={searchClient} future={{ preserveSharedStateOnUnmount: true }}>
        <ThemeProvider theme={theme}>
          <Dialog
            fullScreen={dialogShouldBeFullScreen}
            disableScrollLock={true}
            keepMounted={keepDialogMounted}
            fullWidth
            disableRestoreFocus
            maxWidth='md'
            open={dialogOpen}
            onClose={handleDialogClose}
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
                    onQueryChange={setHasQuery}
                  />
                </Grid>
                <Grid>
                  <Button
                    className='search-modal__esc-button'
                    onClick={handleDialogClose}
                    size='small'
                    variant='outlined'
                  >
                    <CloseIcon fontSize='inherit' />
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
                      >
                        <Tab
                          className='search-modal__tab'
                          value='1'
                          label={<>Libraries {hasQuery && nbHits1 > 0 ? <span>({kFormatter(nbHits1)})</span> : null}</>}
                        />
                        <Tab
                          className='search-modal__tab'
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
                    >
                      <Tab
                        className='search-modal__tab'
                        value='1'
                        label={
                          <>
                            {library.name} {hasQuery && nbHits1 > 0 ? <span>({kFormatter(nbHits1)})</span> : null}
                          </>
                        }
                      />
                      <Tab
                        className='search-modal__tab'
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
                  <Box className='search-modal__tab-panel' hidden={selectedTab !== '1'}>
                    <Index indexName={librariesAlgoliaIndex}>
                      <Configure hitsPerPage={30} />
                      <InfiniteHits
                        urlPrefix={librariesUrlPrefix}
                        setnbHits={setnbHits1}
                        onClick={setRecentSearch}
                        showLibName
                        hasQuery={hasQuery}
                      />
                    </Index>
                  </Box>
                  <Box className='search-modal__tab-panel' hidden={selectedTab !== '2'}>
                    <Index indexName={learnAlgoliaIndex}>
                      <Configure hitsPerPage={30} />
                      <InfiniteHits
                        urlPrefix={learnUrlPrefix}
                        setnbHits={setnbHits2}
                        onClick={setRecentSearch}
                        hasQuery={hasQuery}
                      />
                    </Index>
                  </Box>
                </>
              ) : (
                <>
                  <Box className='search-modal__tab-panel' hidden={selectedTab !== '1'}>
                    <Index indexName={librariesAlgoliaIndex}>
                      <Configure hitsPerPage={30} filters={'library_key:' + library.key} />
                      <InfiniteHits
                        urlPrefix={librariesUrlPrefix}
                        setnbHits={setnbHits1}
                        onClick={setRecentSearch}
                        hasQuery={hasQuery}
                      />
                    </Index>
                  </Box>
                  <Box className='search-modal__tab-panel' hidden={selectedTab !== '2'}>
                    <Index indexName={librariesAlgoliaIndex}>
                      <Configure hitsPerPage={30} filters={'NOT library_key:' + library.key} />
                      <InfiniteHits
                        urlPrefix={librariesUrlPrefix}
                        setnbHits={setnbHits2}
                        onClick={setRecentSearch}
                        showLibName
                        hasQuery={hasQuery}
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
