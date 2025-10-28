import axios from 'axios';
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });
api.interceptors.request.use((config)=>{ const t=typeof window!=='undefined'?localStorage.getItem('noor-token'):null; if(t) config.headers.Authorization='Bearer '+t; return config; });
export default api;
