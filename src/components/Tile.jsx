import React from "react";
import { Link } from "react-router-dom";

export function Tile({ to, title, children }) {
  return (
    <Link to={to} className="tile">
      <strong style={{ display: "block", fontSize: 18, marginBottom: 6 }}>
        {title}
      </strong>
      <span style={{ opacity: 0.8, lineHeight: 1.4 }}>{children}</span>
    </Link>
  );
}

export function TileGrid({ children }) {
  return (
    <div
      className="tile-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        marginTop: 16,
      }}
    >
      {children}
    </div>
  );
}
