import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'x-seoscribe-client-token': 'seoscribe-web-client-v1',
  },
});

export default api;
