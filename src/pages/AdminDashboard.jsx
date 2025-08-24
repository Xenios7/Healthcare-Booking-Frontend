import React from "react";
import { Tile, TileGrid } from "../components/Tile.jsx";

export default function AdminDashboard() {
  return (
    <main className="container">
      <hgroup>
        <h1>Admin Console</h1>
        <p>Manage users and system data</p>
      </hgroup>

      <TileGrid>
        <Tile to="/admin/doctors/new" title="Create Doctor">
          Register a new doctor account.
        </Tile>

        <Tile to="/admin/admins/new" title="Create Admin">
          Add another admin. 
        </Tile>

        <Tile to="/admin/users" title="Manage Users">
          Search, edit, or deactivate users.
        </Tile>

        <Tile to="/admin/appointments" title="All Appointments">
          System-wide appointment view.
        </Tile>
      </TileGrid>
    </main>
  );
}
