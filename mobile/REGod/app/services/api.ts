import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:4000/api'; // Android emulator
// const API_BASE_URL = 'http://localhost:4000/api'; // iOS simulator
// const API_BASE_URL = 'http://YOUR_IP_ADDRESS:4000/api'; // Physical device

interface RegisterData {
  email: string;
  password: string;
  name: string;
  teacher_code?: string; 
}

interface LoginData {
  identifier: string;
  password: string;
}

interface AuthResponse {
  user_id: string;
  auth_token: string;
  refresh_token: string;
  user_data?: any;
  requires_verification?: boolean;
}

class ApiService {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('regod_access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private static async handleResponse(response: Response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }
    
    return data;
  }

  // Authentication endpoints
  static async checkUser(identifier: string) {
    const response = await fetch(`${API_BASE_URL}/auth/check-user`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ identifier }),
    });
    
    return this.handleResponse(response);
  }

  static async register(userData: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: await this.getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  
  const data = await this.handleResponse(response);
  
  // Store tokens
  await AsyncStorage.setItem('regod_access_token', data.auth_token);
  await AsyncStorage.setItem('regod_refresh_token', data.refresh_token);
  
  return data;
}

  static async login(loginData: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(loginData),
    });
    
    const data = await this.handleResponse(response);
    
    // Store tokens
    await AsyncStorage.setItem('regod_access_token', data.auth_token);
    await AsyncStorage.setItem('regod_refresh_token', data.refresh_token);
    
    return data;
  }

  static async verify(identifier: string, verificationCode: string) {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        identifier,
        verification_code: verificationCode,
      }),
    });
    
    return this.handleResponse(response);
  }

  static async logout() {
    await AsyncStorage.removeItem('regod_access_token');
    await AsyncStorage.removeItem('regod_refresh_token');
  }

  // User endpoints
  static async getDashboard() {
    const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  static async getProfile() {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Social auth (placeholder for future implementation)
  static async socialAuth(provider: string, accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/auth/social`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        provider,
        access_token: accessToken,
      }),
    });
    
    return this.handleResponse(response);
  }
}

export default ApiService;