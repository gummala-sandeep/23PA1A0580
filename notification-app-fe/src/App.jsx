import React from "react";
import { NotificationsPage } from "./pages/NotificationsPage";
import "./App.css";

/**
 * Main App Component.
 * Mounts the NotificationsPage inside the main application layout.
 */
export default function App() {
  return (
    <div className="app-container">
      <NotificationsPage />
    </div>
  );
}