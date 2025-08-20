import React from "react";
import { Tile, TileGrid } from "../components/Tile.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

export default function PatientDashboard() {
  const { user } = useAuth();

  return (
    <main className="container">
      <hgroup>
        <h1>Welcome{user?.firstName ? `, ${user.firstName}` : ""}!</h1>
        <p>What would you like to do?</p>
      </hgroup>

      <TileGrid>
        <Tile to="/doctors" title="Find a Doctor">
          Browse doctors, see availability, and book.
        </Tile>

        <Tile to="/me/appointments" title="My Appointments">
          View upcoming & past appointments; cancel if needed.
        </Tile>

        <Tile to="/me/profile" title="My Profile">
          Update name, email, allergies, insurance. (placeholder)
        </Tile>
      </TileGrid>
    </main>
  );
}
