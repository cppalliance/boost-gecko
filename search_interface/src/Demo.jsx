import { libraries } from './libraries';
import SearchDialog from './Search/SearchDialog';

import React from 'react';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Link from '@mui/material/Link';
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';

function Demo() {
  const [library, setLibrary] = React.useState(libraries[0]);

  const handleLibraryChange = (event) => {
    setLibrary(libraries.filter((i) => i.key === event.target.value)[0]);
  };

  const [themeMode, setThemeMode] = React.useState('light');

  const handleModeChange = React.useCallback((event) => {
    setThemeMode(event.target.value);
  }, []);

  return (
    <Container maxWidth='md'>
      <Grid container sx={{ width: '100%' }} spacing={2}>
        <Grid size={{ xs:12 }}>
          <Link variant='h6' underline='none' href='https://github.com/cppalliance/boost-gecko'>
            Boost.Gecko
          </Link>
        </Grid>
        <Grid size={{ xs:3, md:2 }}>
          <FormControl fullWidth>
            <InputLabel>Theme</InputLabel>
            <Select size='small' value={themeMode} onChange={handleModeChange} label='Theme' sx={{ height: 36 }}>
              <MenuItem value='light'>Light</MenuItem>
              <MenuItem value='dark'>Dark</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs:5, md:8 }}>
          <FormControl fullWidth>
            <InputLabel>Library</InputLabel>
            <Select
              size='small'
              value={library ? library.key : 'none'}
              onChange={handleLibraryChange}
              label='Library'
              sx={{ height: 36 }}
            >
              <MenuItem value='none'>
                <em>None</em>
              </MenuItem>
              {libraries.map((i) => (
                <MenuItem key={i.key} value={i.key}>
                  {i.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs:14, md:2 }}>
          <Button
            fullWidth
            sx={{ textTransform: 'none' }}
            startIcon={<SearchIcon />}
            variant='outlined'
            id={'gecko-search-button'}
          >
            Search...
          </Button>
        </Grid>
      </Grid>
      <SearchDialog
        themeMode={themeMode}
        versionWarning={false}
        library={library}
        onLearnPages={false}
        librariesUrlPrefix={'https://www.boost.io/doc/libs/latest'}
        learnUrlPrefix={'https://www.boost.io/doc/'}
        librariesAlgoliaIndex={'1_89_0'}
        learnAlgoliaIndex={'learn'}
        alogliaAppId={'D7O1MLLTAF'}
        alogliaApiKey={'44d0c0aac3c738bebb622150d1ec4ebf'}
      />
    </Container>
  );
}

export default Demo;
