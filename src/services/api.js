import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL when deployed
// For local dev: use your machine's local network IP (e.g. http://192.168.1.5:5000)
export const BASE_URL = 'https://cera-hdj9.onrender.com';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('cera_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Auth
export const registerUser   = (data) => api.post('/auth/register', data);
export const loginUser      = (data) => api.post('/auth/login', data);
export const setPin         = (pin)  => api.post('/auth/set-pin', { pin });
export const verifyPin      = (pin)  => api.post('/auth/verify-pin', { pin });
export const changePin      = (currentPin, newPin) => api.post('/auth/change-pin', { currentPin, newPin });

// User
export const getMe          = ()     => api.get('/user/me');
export const updateProfile  = (data) => api.put('/user/profile', data);
export const updateFcmToken = (fcmToken) => api.put('/user/fcm-token', { fcmToken });
export const lookupUser     = (q)    => api.get('/user/lookup', { params: { q } });
export const getTransactions = (page = 1) => api.get('/user/transactions', { params: { page } });
export const submitKYC      = (data) => api.put('/user/kyc', data);
export const updateAutoProcessing = (data) => api.put('/user/auto-processing', data);

// Transfer
export const ceraTransfer            = (data) => api.post('/transfer', data);
export const getRecentCeraRecipients = ()     => api.get('/transfer/recent-recipients');

// Rates
export const getRates       = ()     => api.get('/rates');

// Account verification
export const verifyBankAccount = (accountNumber, bankName) => api.get('/user/verify-account', { params: { accountNumber, bankName } });

// Security
export const changePassword    = (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword });
export const getTrustedDevices = ()     => api.get('/user/trusted-devices');
export const getLoginActivity  = ()     => api.get('/user/login-activity');

// CERA Tag
export const checkCeraTag = (tag)  => api.get('/user/check-tag', { params: { tag } });
export const claimCeraTag = (tag)  => api.post('/user/claim-tag', { tag });

// Utility (VTU / Bill payments via ClubKonnect)
export const buyAirtime     = (data)    => api.post('/utility/airtime', data);
export const buyData        = (data)    => api.post('/utility/data', data);
export const buyTV          = (data)    => api.post('/utility/tv', data);
export const buyElectricity = (data)    => api.post('/utility/electricity', data);
export const getDataPlans   = (network) => api.get('/utility/data-plans', { params: { network } });

// Bank account verification
export const verifyBankAccountByCode = (accountNumber, bankCode) =>
  api.get('/user/verify-account', { params: { accountNumber, bankCode } });

// Beneficiaries
export const getBeneficiaries    = ()            => api.get('/user/beneficiaries');
export const addBeneficiary      = (data)        => api.post('/user/beneficiaries', data);
export const deleteBeneficiary   = (id)          => api.delete(`/user/beneficiaries/${id}`);

// Rate alerts
export const getRateAlerts       = ()            => api.get('/user/rate-alerts');
export const addRateAlert        = (data)        => api.post('/user/rate-alerts', data);
export const deleteRateAlert     = (id)          => api.delete(`/user/rate-alerts/${id}`);

// Support
export const submitSupportTicket = (data)        => api.post('/user/support', data);
export const getSupportTickets   = ()            => api.get('/user/support');

// Filtered transactions
export const getTransactionsFilt = (params)      => api.get('/user/transactions', { params });

export default api;
