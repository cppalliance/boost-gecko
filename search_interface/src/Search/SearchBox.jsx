import React from 'react';

import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

import { useSearchBox, useInstantSearch } from 'react-instantsearch';

let queryHookTimerId;

function SearchBox({ inputRef, recentSearches, onQueryChange }) {
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
      onInputChange={(e, newValue) => {
        const trimmed = (newValue || '').trim();
        onQueryChange?.(trimmed.length > 0);
        refine(newValue);
      }}
      onChange={(e, newValue) => {
        const nextValue = newValue || '';
        const trimmed = nextValue.trim();
        onQueryChange?.(trimmed.length > 0);
        refine(nextValue);
      }}
      renderOption={(props, option) => (
        <Box {...props}>
          {/* Clock Icon */}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            aria-hidden='true'
            className='search-modal__autocomplete-icon'
          >
            <path d='M19 3H5V5H3V19H5V21H19V19H21V5H19V3ZM19 5V19H5V5H19ZM11 7H13V13H17V15H11V7Z' fill='#050816' />
          </svg>
          {option}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder='Search...'
          inputRef={inputRef}
          slotProps={{
            input: {
              ...params.InputProps,
              className: `${params.InputProps.className || ''} search-modal__input-wrapper`.trim(),
              endAdornment: (
                <React.Fragment>
                  {status === 'loading' || status === 'stalled' ? <CircularProgress size={16} /> : null}
                  <InputAdornment className='search-modal__input-adornment search-modal__end-adornment' position='end'>
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 16 16'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      aria-hidden='true'
                    >
                      <path
                        d='M2.66699 7.33337V8.66671H10.667V10H12.0003V8.66671H13.3337V7.33337H12.0003V6.00004H10.667V7.33337H2.66699ZM9.33366 4.66671H10.667V6.00004H9.33366V4.66671ZM9.33366 4.66671H8.00033V3.33337H9.33366V4.66671ZM9.33366 11.3334H10.667V10H9.33366V11.3334ZM9.33366 11.3334H8.00033V12.6667H9.33366V11.3334Z'
                        fill='currentColor'
                      />
                    </svg>
                  </InputAdornment>
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
              startAdornment: (
                <InputAdornment className='search-modal__input-adornment' position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            },
            htmlInput: {
              ...params.inputProps,
              className: `${params.inputProps.className || ''} search-modal__input`.trim(),
            },
          }}
        />
      )}
    />
  );
}

export default SearchBox;
