import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/lms',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})