import React, { useState } from 'react';
import GameTables from './GameTables';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Button } from '@mui/material';

function App() {
  const [mode, setMode] = useState('dark'); // Start with dark, or 'light' if you prefer

  const theme = createTheme({
    palette: {
      mode,
    },
  });

  // Toggle handler
  const handleToggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{padding: 32}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1>GameID Viewer</h1>
          <Button variant="outlined" onClick={handleToggleTheme}>
            Switch to {mode === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
        </div>
        <GameTables />
      </div>
    </ThemeProvider>
  );
}

export default App;