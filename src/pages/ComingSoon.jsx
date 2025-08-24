import React from "react";
export default function ComingSoon({ title = "Coming soon" }) {
  return (
    <main className="container">
      <h1>{title}</h1>
        {process.env.NODE_ENV === "development" && false && (
          <p className="text-muted-foreground mt-2">UI not implemented yet. (placeholder)</p>
        )}
    </main>
  );
}
