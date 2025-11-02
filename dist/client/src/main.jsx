import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SessionProvider } from "./context/SessionContext";
import { Router } from "wouter";
createRoot(document.getElementById("root")).render(<SessionProvider>
    <Router>
      <App />
    </Router>
  </SessionProvider>);
