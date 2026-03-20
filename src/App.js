import { useState, useRef } from "react";

// True honeycomb tessellation:
// Flat-top hexagons, column-offset grid.
// For flat-top hex with circumradius R:
//   - hex is 2R tall, sqrt(3)*R wide
//   - columns are spaced 1.5*R apart horizontally
//   - every other column is offset DOWN by sqrt(3)*R/2 (half the vertical spacing)
//   - rows within a column are spaced sqrt(3)*R apart vertically

const COLS = 33;
const EVEN_ROWS = 16; // even cols (0,2,4...) are the short/offset ones
const ODD_ROWS = 17;  // odd cols (1,3,5...) are the tall non-offset ones
const HEX_R = 26;

const COL_W = 1.5 * HEX_R;
const ROW_H = Math.sqrt(3) * HEX_R;
const COL_OFFSET = ROW_H / 2;

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const PADDING = 20;

function buildGrid() {
  const cells = [];
  for (let col = 0; col < COLS; col++) {
    const isShort = col % 2 === 0; // even cols are short (16) and offset down
    const numRows = isShort ? EVEN_ROWS : ODD_ROWS;
    const cx = PADDING + HEX_R + col * COL_W;
    const yOffset = isShort ? COL_OFFSET : 0;
    for (let row = 0; row < numRows; row++) {
      const cy = PADDING + HEX_R + yOffset + row * ROW_H;
      cells.push({ row, col, cx, cy, id: `${row}-${col}` });
    }
  }
  return cells;
}

const GRID = buildGrid();
const SVG_WIDTH  = PADDING * 2 + HEX_R + (COLS - 1) * COL_W + HEX_R * 0.5;
const SVG_HEIGHT = PADDING * 2 + HEX_R * 2 + (ODD_ROWS - 1) * ROW_H;

const PRESET_COLORS = [
  { hex: "#111111", name: "Black" },
  { hex: "#1a3d2b", name: "Evergreen" },
  { hex: "#8b1a2a", name: "Holly Berry" },
  { hex: "#2e6b5e", name: "Lake Pine" },
  { hex: "#c4622d", name: "Pumpkin Spice" },
  { hex: "#7a8c5e", name: "Icelandic Moss" },
  { hex: "#7a5230", name: "Acorn" },
  { hex: "#b34233", name: "Terracotta Red" },
  { hex: "#7199a6", name: "Dusty Blue" },
  { hex: "#e8a030", name: "Marigold" },
  { hex: "#d4956a", name: "Desert Bloom" },
  { hex: "#e8a0a8", name: "Cherry Blossom" },
];

export default function HexTileMat() {
  const [tileColors, setTileColors] = useState({});
  const [selectedColor, setSelectedColor] = useState("#1a3d2b");
  const [isDrawing, setIsDrawing] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const colorInputRef = useRef(null);
  const [hoveredColor, setHoveredColor] = useState(null);

  const colorCounts = Object.values(tileColors).reduce((acc, hex) => {
    acc[hex] = (acc[hex] || 0) + 1;
    return acc;
  }, {});

  const handleMouseDown = (id) => {
    setIsDrawing(true);
    const current = tileColors[id];
    // If clicking a tile that already has the selected color, enter erase mode
    const shouldErase = current === selectedColor;
    setEraseMode(shouldErase);
    setTileColors(prev => {
      if (shouldErase) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: selectedColor };
    });
  };

  const handleMouseEnter = (id) => {
    if (!isDrawing) return;
    setTileColors(prev => {
      if (eraseMode) {
        // In erase mode: only remove tiles that match the selected color
        if (prev[id] === selectedColor) {
          const next = { ...prev };
          delete next[id];
          return next;
        }
        return prev;
      }
      // In paint mode: always paint (replace any color, never remove)
      return { ...prev, [id]: selectedColor };
    });
  };

  const reset = () => setTileColors({});

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', monospace",
        padding: "24px",
        userSelect: "none",
      }}
      onMouseUp={() => setIsDrawing(false)}
    >
      {/* Header */}
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <h1 style={{
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          margin: 0,
          opacity: 0.5,
        }}>
          Hex Tile Mat Designer
        </h1>
      </div>

      {/* Mat */}
      <div style={{
        background: "#111",
        borderRadius: 10,
        padding: 0,
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        overflow: "hidden",
        cursor: "crosshair",
      }}>
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ display: "block" }}
        >
          {/* Black background (the mat border/background) */}
          <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#111" rx={8} />

          {GRID.map(({ id, cx, cy }) => (
            <polygon
              key={id}
              points={hexPoints(cx, cy, HEX_R - 1.5)}
              fill={tileColors[id] || "#f0f0f0"}
              stroke="#111"
              strokeWidth={2.5}
              style={{ transition: "fill 0.08s ease", cursor: "crosshair" }}
              onMouseDown={() => handleMouseDown(id)}
              onMouseEnter={() => handleMouseEnter(id)}
            />
          ))}
        </svg>
      </div>

      {/* Controls */}
      <div style={{
        marginTop: 20,
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#2a2a2a",
        borderRadius: 10,
        padding: "12px 18px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}>
        {/* Color picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#666", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Color
          </span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: selectedColor,
              border: "2px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => colorInputRef.current?.click()}
          >
            <input
              ref={colorInputRef}
              type="color"
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              style={{
                position: "absolute",
                opacity: 0,
                width: "100%",
                height: "100%",
                cursor: "pointer",
                top: 0,
                left: 0,
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: "#444" }} />

        {/* Preset swatches */}
        <div style={{ display: "flex", gap: 5 }}>
          {PRESET_COLORS.map(({ hex, name }) => {
            const count = colorCounts[hex] || 0;
            const isHovered = hoveredColor === hex;
            return (
              <div key={hex} style={{ position: "relative" }}>
                {isHovered && (
                  <div style={{
                    position: "absolute",
                    bottom: 30,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1a1a1a",
                    border: "1px solid #555",
                    color: "#fff",
                    fontSize: 11,
                    padding: "3px 7px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 10,
                    letterSpacing: "0.05em",
                  }}>
                    {name} ({count})
                  </div>
                )}
                <div
                  onClick={() => setSelectedColor(hex)}
                  onMouseEnter={() => setHoveredColor(hex)}
                  onMouseLeave={() => setHoveredColor(null)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: hex,
                    cursor: "pointer",
                    border: selectedColor === hex
                      ? "2px solid #fff"
                      : "2px solid rgba(255,255,255,0.15)",
                    transition: "border 0.1s",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: "#444" }} />

        {/* Reset */}
        <button
          onClick={reset}
          style={{
            background: "transparent",
            border: "1px solid #444",
            color: "#aaa",
            borderRadius: 6,
            padding: "5px 14px",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.15s",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => {
            e.target.style.borderColor = "#fff";
            e.target.style.color = "#fff";
          }}
          onMouseLeave={e => {
            e.target.style.borderColor = "#444";
            e.target.style.color = "#aaa";
          }}
        >
          Reset
        </button>
      </div>

      <p style={{
        color: "#444",
        fontSize: 11,
        marginTop: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        Click or drag to paint · Click colored tile to erase
      </p>
    </div>
  );
}
