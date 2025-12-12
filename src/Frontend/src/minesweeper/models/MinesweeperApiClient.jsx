import axios from "axios";

export const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/minesweeper";

const axiosOptions = {
    baseURL: API_BASE,
    withCredentials: true
};

export const ApiClient = axios.create(axiosOptions);
