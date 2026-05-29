import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Load non-critical cosmetic fonts asynchronously after application initializes
const loadFonts = () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Press+Start+2P&family=Rajdhani:wght@400;500;700&family=Audiowide&family=Exo+2:wght@400;500;700&family=Chakra+Petch:wght@400;500;700&display=swap&text=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!%22%23$%25%26%27()*%2B,-./:;<%3D>?@[\]%5E_%60{|}~%20";
  document.head.appendChild(link);
};

if (document.readyState === "complete") {
  loadFonts();
} else {
  window.addEventListener("load", loadFonts);
}

createRoot(document.getElementById("root")!).render(<App />);
