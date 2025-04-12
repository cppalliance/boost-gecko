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
import SvgIcon from '@mui/material/SvgIcon';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

import RecentSearches from 'recent-searches';

import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Index, Configure, PoweredBy } from 'react-instantsearch';

import CppallianceLogo from './CppallianceLogo';
import SearchBox from './SearchBox';
import InfiniteHits from './InfiniteHits';

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
          PaperProps={{ style: dialogShouldBeFullScreen ? {} : { height: '95vh' } }}
          sx={{ zIndex: 99999 }}
        >
          <DialogTitle sx={{ p: 1.5, pb: 0, color: theme.palette.text.primary }}>
            <Grid container spacing={1}>
              <Grid item xs>
                <SearchBox
                  inputRef={inputRef}
                  recentSearches={inputRef.current ? recentSearches.getRecentSearches(inputRef.current.value) : []}
                />
              </Grid>
              <Grid item>
                <Button
                  onClick={handleDialogClose}
                  size='small'
                  variant='outlined'
                  sx={{ pt: 0.8, minWidth: 44, height: 44, textTransform: 'none', flexDirection: 'column' }}
                >
                  <CloseIcon fontSize='inherit' />
                  Esc
                </Button>
              </Grid>
              <Grid item xs={12}>
                {versionWarning && (
                  <Typography variant='caption' sx={{ display: 'block' }}>
                    <Box component='span' fontWeight='bolder'>
                      Note:
                    </Box>{' '}
                    search limited to the latest version of documentation.
                  </Typography>
                )}
                {!library ? (
                  <>
                    <Typography variant='caption' sx={{ display: 'block' }}>
                      <Box component='span' fontWeight='bolder'>
                        Tip:
                      </Box>{' '}
                      limit the search scope by navigating to a library page.
                    </Typography>
                    <Tabs
                      value={selectedTab}
                      onChange={handleTabChange}
                      variant='fullWidth'
                      sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                      <Tab
                        value='1'
                        sx={{ textTransform: 'none', display: 'inline' }}
                        label={
                          <>
                            Libraries <Typography variant='caption'>({kFormatter(nbHits1)})</Typography>
                          </>
                        }
                      />
                      <Tab
                        value='2'
                        sx={{ textTransform: 'none', display: 'inline' }}
                        label={
                          <>
                            Learn <Typography variant='caption'>({kFormatter(nbHits2)})</Typography>
                          </>
                        }
                      />
                    </Tabs>
                  </>
                ) : (
                  <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    variant='fullWidth'
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab
                      value='1'
                      sx={{ textTransform: 'none', display: 'inline' }}
                      label={
                        <>
                          {library.name} <Typography variant='caption'>({kFormatter(nbHits1)})</Typography>
                        </>
                      }
                    />
                    <Tab
                      value='2'
                      sx={{ textTransform: 'none', display: 'inline' }}
                      label={
                        <>
                          Other Libraries <Typography variant='caption'>({kFormatter(nbHits2)})</Typography>
                        </>
                      }
                    />
                  </Tabs>
                )}
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent sx={{ p: 1.5 }}>
            {!library ? (
              <>
                <Box hidden={selectedTab !== '1'} sx={{ pt: 1, typography: 'body1' }}>
                  <Index indexName={librariesAlgoliaIndex}>
                    <Configure hitsPerPage={30} />
                    <InfiniteHits
                      urlPrefix={librariesUrlPrefix}
                      setnbHits={setnbHits1}
                      onClick={setRecentSearch}
                      showLibName
                    />
                  </Index>
                </Box>
                <Box hidden={selectedTab !== '2'} sx={{ pt: 1, typography: 'body1' }}>
                  <Index indexName={learnAlgoliaIndex}>
                    <Configure hitsPerPage={30} />
                    <InfiniteHits urlPrefix={learnUrlPrefix} setnbHits={setnbHits2} onClick={setRecentSearch} />
                  </Index>
                </Box>
              </>
            ) : (
              <>
                <Box hidden={selectedTab !== '1'} sx={{ pt: 1, typography: 'body1' }}>
                  <Index indexName={librariesAlgoliaIndex}>
                    <Configure hitsPerPage={30} filters={'library_key:' + library.key} />
                    <InfiniteHits urlPrefix={librariesUrlPrefix} setnbHits={setnbHits1} onClick={setRecentSearch} />
                  </Index>
                </Box>
                <Box hidden={selectedTab !== '2'} sx={{ pt: 1, typography: 'body1' }}>
                  <Index indexName={librariesAlgoliaIndex}>
                    <Configure hitsPerPage={30} filters={'NOT library_key:' + library.key} />
                    <InfiniteHits
                      urlPrefix={librariesUrlPrefix}
                      setnbHits={setnbHits2}
                      onClick={setRecentSearch}
                      showLibName
                    />
                  </Index>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ pc: 1.5, py: 0.5 }}>
            <Grid container>
              <Grid item xs={6}>
                <PoweredBy theme={theme.palette.mode} style={{ width: 140, paddingTop: 12 }} />
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Button
                  sx={{ textTransform: 'none' }}
                  target='_blank'
                  href='https://github.com/cppalliance/boost-gecko/issues'
                  startIcon={<SvgIcon component={CppallianceLogo} inheritViewBox />}
                >
                  Report Issue
                </Button>
              </Grid>
            </Grid>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </InstantSearch>
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
