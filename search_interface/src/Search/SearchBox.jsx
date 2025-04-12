import React from 'react';

import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import HistoryIcon from '@mui/icons-material/History';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

import { useSearchBox, useInstantSearch } from 'react-instantsearch';

let queryHookTimerId;

function SearchBox({ inputRef, recentSearches }) {
  const theme = useTheme();
  const queryHook = React.useCallback((query, search) => {
    clearTimeout(queryHookTimerId);
    queryHookTimerId = setTimeout(() => search(query), 300);
  }, []);
  const { currentRefinement, refine } = useSearchBox({ queryHook });
  const { status } = useInstantSearch();

  return (
    <Autocomplete
      freeSolo
      disablePortal
      disableClearable
      size='small'
      options={recentSearches.map((option) => option.query)}
      value={currentRefinement}
      onInputChange={(e, newValue) => refine(newValue)}
      onChange={(e, newValue) => refine(newValue || '')}
      renderOption={(props, option) => (
        <Box {...props}>
          <HistoryIcon sx={{ mr: 1.5, color: theme.palette.text.secondary }} />
          {option}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          sx={{
            '& input:focus': {
              boxShadow: 'none',
            },
          }}
          placeholder='Search...'
          inputRef={inputRef}
          InputProps={{
            ...params.InputProps,
            style: { fontSize: '1.2rem' },
            endAdornment: (
              <React.Fragment>
                {status === 'loading' || status === 'stalled' ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
}

export default SearchBox;
