import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const getSystemStatus = () => api.get('/status').then(res => res.data);
export const getLatestSensors = () => api.get('/sensors/latest').then(res => res.data);
export const getSensorHistory = (limit = 30) => api.get(`/sensors/history?limit=${limit}`).then(res => res.data);
export const postSimulateReading = (data) => api.post('/sensors/simulate', data).then(res => res.data);

export const getScenarios = () => api.get('/simulation/scenarios').then(res => res.data);
export const applyScenario = (key) => api.post(`/simulation/scenario/${key}`).then(res => res.data);

export const startSimulation = () => api.post('/simulation/start').then(res => res.data);
export const pauseSimulation = () => api.post('/simulation/pause').then(res => res.data);
export const resetSimulation = () => api.post('/simulation/reset').then(res => res.data);

export const getAgents = () => api.get('/agents').then(res => res.data);
export const runAgentCycle = () => api.post('/agents/run').then(res => res.data);
export const getDecisions = (limit = 40) => api.get(`/decisions?limit=${limit}`).then(res => res.data);

export const getAlerts = () => api.get('/alerts').then(res => res.data);
export const clearAlerts = () => api.post('/alerts/clear').then(res => res.data);

export const setManualIrrigation = (action, reason) => api.post('/irrigation/manual', { action, reason }).then(res => res.data);
export const setAutoIrrigation = () => api.post('/irrigation/auto').then(res => res.data);
export const getIrrigationEvents = (limit = 40) => api.get(`/irrigation/events?limit=${limit}`).then(res => res.data);

export const getRobotState = () => api.get('/robot/state').then(res => res.data);

export const uploadCropImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/crop/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

export const getCropHistory = () => api.get('/crop/history').then(res => res.data);

export const getExportUrl = (dataset) => `${API_BASE}/reports/export?dataset=${dataset}`;

export const getSettings = () => api.get('/settings').then(res => res.data);
export const updateSettings = (data) => api.post('/settings', data).then(res => res.data);

export default api;

