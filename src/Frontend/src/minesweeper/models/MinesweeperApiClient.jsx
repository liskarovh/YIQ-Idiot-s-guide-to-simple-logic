/**
 * @file MinesweeperApiClient.jsx
 * @brief Axios API client configuration for Minesweeper game.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import axios from "axios";

const APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
export const API_BASE = `${APP_API_URL}/api/minesweeper`;

const axiosOptions = {
    baseURL: API_BASE,
    withCredentials: true
};

export const ApiClient = axios.create(axiosOptions);
