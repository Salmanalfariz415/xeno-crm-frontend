import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Customers
  getCustomers: (params) => client.get('/customers', { params }),
  getCustomerById: (id) => client.get(`/customers/${id}`),
  importCustomers: (formData) => client.post('/customers/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Segments
  getSegments: () => client.get('/segments'),
  getSegmentCustomers: (id) => client.get(`/segments/${id}/customers`),
  createSegment: (data) => client.post('/segments', data),
  aiGenerateSegment: (prompt) => client.post('/segments/ai-generate', { prompt }),

  // Campaigns
  getCampaigns: () => client.get('/campaigns'),
  createCampaign: (data) => client.post('/campaigns', data),
  aiGenerateCopy: (data) => client.post('/campaigns/ai-copywrite', data),
  sendCampaign: (id) => client.post(`/campaigns/${id}/send`),
  getCampaignAnalytics: (id) => client.get(`/campaigns/${id}/analytics`),
  getCampaignAIInsights: (id) => client.post(`/campaigns/${id}/ai-insights`)
};

export default api;
