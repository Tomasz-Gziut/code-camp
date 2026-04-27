import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { installMockApi } from "./mockApi/installMockApi";

installMockApi();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
