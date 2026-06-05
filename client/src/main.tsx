import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Router } from "wouter";

// SessionProvider now lives inside App so it reliably wraps every route.
createRoot(document.getElementById("root")!).render(
  <Router>
    <App />
  </Router>
);
