import React from "react";
import { Tile, TileGrid } from "../components/Tile.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

export default function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <main className="container">
      <hgroup>
        <h1>Hello Dr. {user?.lastName || user?.firstName || ""}</h1>
        <p>Quick actions</p>
      </hgroup>

      <TileGrid>
        <Tile to="/doctor/slots/new" title="Create Time Slots">
          Open availability so patients can book you.
        </Tile>

        <Tile to="/doctor/slots" title="My Slots">
          See / edit your upcoming availability.
        </Tile>

        <Tile to="/doctor/appointments" title="Today’s Appointments">
          View today’s schedule and patient details.
        </Tile>

        <Tile to="/doctor/profile" title="My Profile">
          Update speciality, location, license number. 
        </Tile>
      </TileGrid>
    </main>
  );
}
