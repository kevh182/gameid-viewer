import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  Select,
  MenuItem,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TableContainer,
  Paper,
} from '@mui/material';

// Config: Filenames and GitHub raw CSV base URL
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/kevh182/Redump_GameID/main/";
const FILES = [
  { file: "Microsoft_Xbox_Redump_GameID_List.csv", name: "Microsoft Xbox" },
  { file: "Nintendo_64_No-Intro_GameID.csv", name: "Nintendo 64" },
  { file: "Nintendo_GameCube_Redump_GameID_List.csv", name: "Nintendo GameCube" },
  { file: "Nintendo_Wii_Redump_GameID_List.csv", name: "Nintendo Wii" },
  { file: "Panasonic_3DO_Redump_GameID_List.csv", name: "The 3D0 Company" },
  { file: "Sega_Dreamcast_Redump_GameID_List.csv", name: "Sega Dreamcast" },
  { file: "Sega_Mega_CD_Redump_GameID_List.csv", name: "Sega CD / Mega CD" },
  { file: "Sega_MegaDrive_Genesis_No-Intro_GameID.csv", name: "Sega Genesis/Mega Drive" },
  { file: "Sega_Saturn_Redump_GameID_List.csv", name: "Sega Saturn" },
  { file: "Sony_Playstation_Redump_GameID_List.csv", name: "Sony PlayStation" },
  { file: "Sony_Playstation_2_Redump_GameID_List.csv", name: "Sony PlayStation 2" },
  { file: "Sony_Playstation_Portable_Redump_GameID_List.csv", name: "Sony PlayStation Portable (PSP)" },
];

function GameTables() {
  const [selectedFile, setSelectedFile] = useState('');
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');

  // For column visibility UI
  const [columns, setColumns] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({});

  // Load selected CSV only when selectedFile changes
  useEffect(() => {
    if (!selectedFile) {
      setData([]);
      setColumns([]);
      return;
    }
    async function loadCSV() {
      const url = GITHUB_RAW_BASE + selectedFile;
      const csvText = await fetch(url).then(res => res.text());
      let parsed = Papa.parse(csvText, { header: true }).data;
      // Remove any blank rows (common with Papa)
      parsed = parsed.filter(row => Object.values(row).some(v => !!v));
      setData(parsed);
      // Dynamically set columns
      const allCols = new Set();
      parsed.forEach(row => Object.keys(row).forEach(col => allCols.add(col)));
      setColumns([...allCols]);
    }
    loadCSV();
  }, [selectedFile]);

  // Whenever data columns update, reset column visibility (keep user overrides)
  useEffect(() => {
    if (columns.length) {
      setVisibleColumns(prev =>
        columns.reduce(
          (obj, c) => ({ ...obj, [c]: prev[c] === undefined ? true : prev[c] }),
          {}
        )
      );
    }
  }, [columns]);

  // Export currently filtered table to CSV (visible columns only)
  const handleExport = () => {
    const exportData = data.map(row =>
      Object.fromEntries(
        columns.filter(col => visibleColumns[col]).map(col => [col, row[col]])
      )
    );
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile || 'export.csv';
    a.click();
  };

  // Only show rows matching search string
  const filteredData = data.filter(row =>
    columns
      .filter(col => visibleColumns[col])
      .map(col => row[col])
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <h2>Select GameID List</h2>
      <Select
        value={selectedFile}
        onChange={e => setSelectedFile(e.target.value)}
        style={{ minWidth: 320 }}
        size="small"
      >
        <MenuItem value="">-- Choose a CSV file --</MenuItem>
        {FILES.map(f => (
          <MenuItem key={f.file} value={f.file}>
            {f.name}
          </MenuItem>
        ))}
      </Select>
      <TextField
        label="Search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        style={{ marginLeft: 16, minWidth: 220 }}
        disabled={!selectedFile}
      />
      <Button
        variant="contained"
        onClick={handleExport}
        style={{ marginLeft: 16 }}
        disabled={!selectedFile || !filteredData.length}
      >
        Export to CSV
      </Button>
      <Button
        variant="outlined"
        onClick={e => setAnchorEl(e.currentTarget)}
        style={{ marginLeft: 16 }}
        disabled={columns.length === 0}
      >
        Columns
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <FormGroup style={{ padding: 16 }}>
          {columns.map(column => (
            <FormControlLabel
              key={column}
              control={
                <Checkbox
                  checked={visibleColumns[column] ?? true}
                  onChange={() =>
                    setVisibleColumns(v => ({
                      ...v,
                      [column]: !v[column],
                    }))
                  }
                />
              }
              label={column}
            />
          ))}
        </FormGroup>
      </Popover>
      <TableContainer
        component={Paper}
        style={{ maxHeight: '70vh', marginTop: 24, minWidth: 800, overflow: 'auto' }}
      >
        {selectedFile && columns.length > 0 && (
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.filter(key => visibleColumns[key]).map(key => (
                  <TableCell key={key}>{key}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, i) => (
                <TableRow key={i}>
                  {columns.filter(key => visibleColumns[key]).map((key, j) => (
                    <TableCell key={j}>{row[key]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!selectedFile && <p style={{ marginTop: 20, padding: 24 }}>Select a CSV to view its games list.</p>}
        {selectedFile && columns.length > 0 && !filteredData.length && (
          <p style={{ marginTop: 20, padding: 24 }}>No results.</p>
        )}
        {selectedFile && columns.length === 0 && (
          <p style={{ marginTop: 20, padding: 24 }}>Loading...</p>
        )}
      </TableContainer>
    </div>
  );
}

export default GameTables;