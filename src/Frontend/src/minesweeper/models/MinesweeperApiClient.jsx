import axios from "axios";

console.log("API Base URL:", process.env.REACT_APP_API_URL);
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api/minesweeper";

const axiosOptions = {
    baseURL: API_BASE,
    withCredentials: true
};

export const ApiClient = axios.create(axiosOptions);
