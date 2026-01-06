import React, { useState, useEffect, useRef } from 'react';
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
import 'react-resizable/css/styles.css';

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

const MIN_COL_WIDTH = 50;
const MAX_COL_WIDTH = 1200;
const DEFAULT_COL_WIDTH = 180;

function GameTables() {
  const [selectedFile, setSelectedFile] = useState('');
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');

  const [columns, setColumns] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [colWidths, setColWidths] = useState({});

  // Refs for measuring content width
  const cellRefs = useRef({});
  const headerRefs = useRef({});

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
          (obj, c) => ({ ...obj, [c]: prev[c] || DEFAULT_COL_WIDTH }),
          {}
        )
      );
      cellRefs.current = {};
      headerRefs.current = {};
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

  // Resize handler (drag)
  const handleResize = (col, newWidth) => {
    setColWidths((prev) => ({
      ...prev,
      [col]: Math.max(MIN_COL_WIDTH, Math.min(newWidth, MAX_COL_WIDTH))
    }));
  };

  // Double-click autosize handler
  const handleAutoSize = (col) => {
    let maxWidth = 0;

    // Check header width
    if (headerRefs.current[col]?.current) {
      const headerWidth = headerRefs.current[col].current.scrollWidth;
      maxWidth = Math.max(maxWidth, headerWidth);
    }

    // Check all visible data cell widths
    if (cellRefs.current[col] && Array.isArray(cellRefs.current[col])) {
      cellRefs.current[col].forEach(ref => {
        if (ref?.current) {
          const cellWidth = ref.current.scrollWidth;
          maxWidth = Math.max(maxWidth, cellWidth);
        }
      });
    }

    // Add padding and constrain
    const finalWidth = Math.max(
      MIN_COL_WIDTH,
      Math.min(maxWidth + 16, MAX_COL_WIDTH)
    );

    setColWidths(prev => ({
      ...prev,
      [col]: finalWidth
    }));
  };

  // Resizable header cell wrapper
  const ResizableTH = ({ col, width, children }) => {
    if (! headerRefs.current[col]) {
      headerRefs.current[col] = React.createRef();
    }

    return (
      <ResizableBox
        width={width}
        height={40}
        axis="x"
        handle={
          <div
            className="custom-table-col-resizer"
            style={{
              position: "absolute",
              right: 0,
              top:  0,
              height: "100%",
              width: "12px",
              cursor: "col-resize",
              zIndex: 1,
              backgroundColor: "#1976d2",
              opacity: 0.6,
            }}
            onDoubleClick={e => {
              e.stopPropagation();
              e.preventDefault();
              handleAutoSize(col);
            }}
            title="Drag to resize | Double-click to auto-fit"
          />
        }
        onResizeStop={(e, { size }) => handleResize(col, size.width)}
        draggableOpts={{ enableUserSelectHack: false }}
        minConstraints={[MIN_COL_WIDTH, 40]}
        maxConstraints={[MAX_COL_WIDTH, 40]}
        style={{ display: "inline-block" }}
        resizeHandles={['e']}
      >
        <div
          ref={headerRefs.current[col]}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            display:  "flex",
            alignItems:  "center",
            overflow: "hidden",
            whiteSpace: "nowrap",
            paddingRight: "12px"
          }}
        >
          {children}
        </div>
      </ResizableBox>
    );
  };

  // Get or create refs for cell measurement
  const getCellRef = (col, i) => {
    if (!cellRefs.current[col]) {
      cellRefs.current[col] = [];
    }
    if (!cellRefs.current[col][i]) {
      cellRefs.current[col][i] = React.createRef();
    }
    return cellRefs.current[col][i];
  };

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
        disabled={! selectedFile}
      />
      <Button
        variant="contained"
        onClick={handleExport}
        style={{ marginLeft: 16 }}
        disabled={!selectedFile || ! filteredData.length}
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
                  checked={visibleColumns[column] ??  true}
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
                      width: colWidths[key] || DEFAULT_COL_WIDTH,
                      minWidth: MIN_COL_WIDTH,
                      paddingRight: 0,
                      position: "relative",
                      zIndex: 10
                    }}
                  >
                    <ResizableTH col={key} width={colWidths[key] || DEFAULT_COL_WIDTH}>
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
                      ref={getCellRef(key, i)}
                      style={{
                        width: colWidths[key] || DEFAULT_COL_WIDTH,
                        minWidth: MIN_COL_WIDTH,
                        maxWidth:  MAX_COL_WIDTH,
                        padding: "8px",
                        overflow: 'hidden',
                        textOverflow:  'ellipsis',
                        whiteSpace: 'normal',
                        wordBreak:  'break-word'
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
        {selectedFile && columns.length > 0 && ! filteredData.length && (
          <p style={{ marginTop:  20, padding: 24 }}>No results.</p>
        )}
        {selectedFile && columns.length === 0 && (
          <p style={{ marginTop: 20, padding: 24 }}>Loading...</p>
        )}
      </TableContainer>
    </div>
  );
}

export default GameTables;