/**
 * @file index.js
 * @brief Entry point for the React application.
 *
 * @author David Krejčí \<xkrejcd00>
 */

import React from "react";
import {createRoot} from "react-dom/client";
import App from "./App.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
