import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { waitForDeviceReady, isCordova, setStatusBarStyle, setStatusBarBackgroundColor } from "./services/cordovaBridge";

// Initialize app after device is ready (for Cordova) or immediately (for web)
const initializeApp = async () => {
  if (isCordova()) {
    await waitForDeviceReady();
    
    // Configure status bar for native apps
    setStatusBarStyle('light');
    setStatusBarBackgroundColor('#0a0a0a');
    
    console.log('Cordova device ready, app initialized');
  }
  
  createRoot(document.getElementById("root")!).render(<App />);
};

initializeApp();
