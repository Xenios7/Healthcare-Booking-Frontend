import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-semibold mb-3">Page not found</h1>
      <Link to="/" className="underline">Go home</Link>
    </div>
  );
}
