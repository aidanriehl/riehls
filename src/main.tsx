import { createRoot } from "react-dom/client";
import OneSignal from 'react-onesignal';
import App from "./App.tsx";
import "./index.css";

OneSignal.init({
  appId: '3348d169-1ef7-4dd9-ae3d-3be375d02db2',
  allowLocalhostAsSecureOrigin: true,
}).catch((err) => console.warn('OneSignal init error:', err));

createRoot(document.getElementById("root")!).render(<App />);
