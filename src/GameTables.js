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
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css'; // import styles for resize handles

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/kevh182/Redump_GameID/main/";
const FILES = [
  { file: "Microsoft_Xbox_Redump_GameID_List.csv", name: "Microsoft Xbox" },
  { file: "Nintendo_64_No-Intro_GameID.csv", name: "Nintendo 64" },
  { file: "Nintendo_GameCube_Redump_GameID_List.csv", name: "Nintendo GameCube" },
  { file: "Nintendo_Wii_Redump_GameID_List.csv", name: "Nintendo Wii" },
  { file: "Panasonic_3DO_Redump_GameID_List.csv", name: "The 3DO Company" },
  { file: "Sega_Dreamcast_Redump_GameID_List.csv", name: "Sega Dreamcast (Redump)" },
  { file: "Sega_Dreamcast_TOSEC_GameID_List.csv", name: "Sega Dreamcast (TOSEC)" },
  { file: "Sega_Mega_CD_Redump_GameID_List.csv", name: "Sega CD / Mega CD" },
  { file: "Sega_MegaDrive_Genesis_No-Intro_GameID.csv", name: "Sega Genesis/Mega Drive" },
  { file: "Sega_Saturn_Redump_GameID_List.csv", name: "Sega Saturn (Redump)" },
  { file: "Sega_Saturn_TOSEC_GameID_List.csv", name: "Sega Saturn (TOSEC)" },
  { file: "Sony_Playstation_Redump_GameID_List.csv", name: "Sony PlayStation" },
  { file: "Sony_Playstation_2_Redump_GameID_List.csv", name: "Sony PlayStation 2" },
  { file: "Sony_Playstation_Portable_Redump_GameID_List.csv", name: "Sony PlayStation Portable (PSP)" },
];

function GameTables() {
  const [selectedFile, setSelectedFile] = useState('');
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');

  const [columns, setColumns] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({});

  // Track column widths (default 180px per col)
  const [colWidths, setColWidths] = useState({});

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
      parsed = parsed.filter(row => Object.values(row).some(v => !!v));
      setData(parsed);
      const allCols = new Set();
      parsed.forEach(row => Object.keys(row).forEach(col => allCols.add(col)));
      setColumns([...allCols]);
    }
    loadCSV();
  }, [selectedFile]);

  useEffect(() => {
    if (columns.length) {
      setVisibleColumns(prev =>
        columns.reduce(
          (obj, c) => ({ ...obj, [c]: prev[c] === undefined ? true : prev[c] }),
          {}
        )
      );
      setColWidths(prev =>
        columns.reduce(
          (obj, c) => ({ ...obj, [c]: prev[c] || 180 }),
          {}
        )
      );
    }
  }, [columns]);

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

  const filteredData = data.filter(row =>
    columns
      .filter(col => visibleColumns[col])
      .map(col => row[col])
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleResize = (col, newWidth) => {
    setColWidths((prev) => ({
      ...prev,
      [col]: Math.max(newWidth, 50) // minimum width 50px
    }));
  };

  // Helper for resizable table header cell
  const ResizableTH = ({ col, width, children }) => (
    <ResizableBox
      width={width}
      height={40}
      axis="x"
      handle={
        <span
          className="custom-table-col-resizer"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            width: "8px",
            cursor: "col-resize",
            zIndex: 1
          }}
        />
      }
      onResizeStop={(e, { size }) => handleResize(col, size.width)}
      draggableOpts={{ enableUserSelectHack: false }}
      minConstraints={[50, 40]}
      maxConstraints={[600, 40]}
      style={{ display: "inline-block" }}
      resizeHandles={['e']}
    >
      <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center" }}>
        {children}
      </div>
    </ResizableBox>
  );

  return (
    <div>
      <h2>Select CSV List</h2>
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
                  <TableCell
                    key={key}
                    style={{
                      width: colWidths[key] || 180,
                      minWidth: 50,
                      paddingRight: 2,
                      position: "relative",
                      zIndex: 10
                    }}
                  >
                    <ResizableTH col={key} width={colWidths[key] || 180}>
                      {key}
                    </ResizableTH>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, i) => (
                <TableRow key={i}>
                  {columns.filter(key => visibleColumns[key]).map((key, j) => (
                    <TableCell
                      key={j}
                      style={{
                        width: colWidths[key] || 180,
                        minWidth: 50,
                        maxWidth: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingRight: 2
                      }}
                    >
                      {row[key]}
                    </TableCell>
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
      <style>
        {`
          .custom-table-col-resizer {
              background: transparent;
          }
          .custom-table-col-resizer:hover {
              background: #aaa;
          }
        `}
      </style>
    </div>
  );
}

export default GameTables;