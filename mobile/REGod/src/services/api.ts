import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config/constants';
import { Platform } from 'react-native';

// Dynamic API base URL with auto-switch (ngrok/local)
class ApiBaseUrlResolver {
  private static baseUrl: string | null = null;
  private static readonly storageKey = 'regod_api_base_url';

  private static normalizeRoot(root: string): string {
    return root.trim().replace(/\/$/, '');
  }

  private static async probeRoot(root: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${this.normalizeRoot(root)}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  static async ensure(): Promise<string> {
    if (this.baseUrl) return this.baseUrl;

    // 1) Use cached value if it still responds
    try {
      const cached = await AsyncStorage.getItem(this.storageKey);
      if (cached && (await this.probeRoot(cached.replace(/\/api$/, '')))) {
        this.baseUrl = this.normalizeRoot(cached);
        return this.baseUrl;
      }
    } catch {}

    // 2) Use CONFIG.API_BASE_URL if reachable
    if (CONFIG.API_BASE_URL) {
      const root = CONFIG.API_BASE_URL.trim().replace(/\/api$/, '');
      if (await this.probeRoot(root)) {
        this.baseUrl = this.normalizeRoot(CONFIG.API_BASE_URL);
        await AsyncStorage.setItem(this.storageKey, this.baseUrl);
        return this.baseUrl;
      }
    }

    // 3) Try common local roots in order
    const candidates: string[] = [];
    // Android emulator host
    candidates.push('http://10.0.2.2:4000');
    // iOS simulator / web
    candidates.push('http://localhost:4000');
    candidates.push('http://127.0.0.1:4000');

    for (const root of candidates) {
      if (await this.probeRoot(root)) {
        this.baseUrl = `${this.normalizeRoot(root)}/api`;
        await AsyncStorage.setItem(this.storageKey, this.baseUrl);
        return this.baseUrl;
      }
    }

    // 4) Fallback to provided CONFIG even if not reachable
    this.baseUrl = this.normalizeRoot(CONFIG.API_BASE_URL || 'http://10.0.2.2:4000/api');
    return this.baseUrl;
  }
}

// Types and Interfaces
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

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
  phone?: string;
  avatar_url?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url?: string;
  category: string;
  difficulty: string;
  is_active: boolean;
  created_by: string;
}

interface Chapter {
  id: number;
  course_id: number;
  title: string;
  cover_image_url?: string;
  order: number;
  is_active: boolean;
  quiz?: any;
}

interface Module {
  id: number;
  course_id: number;
  chapter_id?: number;
  title: string;
  description?: string;
  content?: string;
  key_verses?: string;
  key_verses_ref?: string;
  key_verses_json?: any;
  lesson_study?: string;
  lesson_study_ref?: string;
  response_prompt?: string;
  music_selection?: string;
  further_study?: string;
  further_study_json?: any;
  personal_experiences?: string;
  resources?: string;
  resources_json?: any;
  artwork?: string;
  header_image_url?: string;
  media_url?: string;
  quiz?: any;
  order: number;
  is_active: boolean;
}

interface Note {
  id: number;
  user_id: string;
  course_id: number;
  lesson_id: number;
  note_content: string;
  created_at: string;
  updated_at: string;
  course_title: string;
  lesson_title: string;
}

interface DashboardResponse {
  user: User;
  last_visited_course?: {
    course_id: number;
    course_title: string;
    thumbnail_url?: string;
    last_visited_module_id?: number;
    last_visited_module_title?: string;
    overall_progress_percentage: number;
    continue_url: string;
  };
  available_courses: Array<{
    course_id: number;
    course_title: string;
    description: string;
    thumbnail_url?: string;
    category: string;
    difficulty: string;
    progress_percentage: number;
    is_new: boolean;
    is_continue_available: boolean;
  }>;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  course_id?: number;
  module_id?: number;
}

interface ChatResponse {
  message: string;
  suggestions?: string[];
}

class ApiService {
  private static async base(): Promise<string> {
    return await ApiBaseUrlResolver.ensure();
  }
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    // Try access token first, fallback to Clerk session token
    let token = await AsyncStorage.getItem('regod_access_token');
    
    if (!token) {
      token = await AsyncStorage.getItem('clerk_session_token');
    }

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }




  // Wrapper function to make authenticated requests with automatic token refresh
  static async makeAuthenticatedRequest<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${await this.base()}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle authentication errors with token refresh
      if ((response.status === 401 || response.status === 403) && retryCount === 0) {
        console.log('Token expired, attempting refresh...');
        try {
          const refreshed = await this.refreshTokenIfNeeded();
          if (refreshed) {
            console.log('Token refreshed, retrying request...');
            return this.makeAuthenticatedRequest<T>(url, options, 1);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
        
        // If refresh failed or no refresh token available, clear tokens
        await this.clearTokens();
        throw new Error('Authentication expired. Please login again.');
      }

      // Handle other errors
      const errorMessage = data.error?.message || data.detail || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  }

  private static async handleResponse(response: Response) {
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || data.message || `Request failed with status ${response.status}`;

      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(errorMessage);
    }

    return data;
  }

  // Authentication endpoints
  static async checkUser(identifier: string) {
    const response = await fetch(`${await this.base()}/auth/check-user`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ identifier }),
    });
    
    return this.handleResponse(response);
  }

  static async register(userData: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${await this.base()}/auth/register`, {
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
    const response = await fetch(`${await this.base()}/auth/login`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(loginData),
    });
    
    const data = await this.handleResponse(response);

    // Persist user for immediate UI usage if present
    if (data && data.id) {
      const normalizedUser: User = {
        id: String(data.id),
        email: data.email ?? '',
        name: data.name ?? '',
        role: Array.isArray(data.roles) && data.roles.length ? data.roles[0] : (data.role ?? 'student'),
        verified: data.is_verified ?? data.verified ?? false,
      };
      try { await AsyncStorage.setItem('regod_user_data', JSON.stringify(normalizedUser)); } catch {}
    }
    
    // Store tokens
    await AsyncStorage.setItem('regod_access_token', data.auth_token);
    await AsyncStorage.setItem('regod_refresh_token', data.refresh_token);
    
    return data;
  }

  // Clerk session exchange
  static async clerkExchange(identifier: string): Promise<AuthResponse> {
    const response = await fetch(`${await this.base()}/auth/clerk-exchange`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ identifier }),
    });
    const data = await this.handleResponse(response);
    await AsyncStorage.setItem('regod_access_token', data.auth_token);
    await AsyncStorage.setItem('regod_refresh_token', data.refresh_token);
    return data;
  }

  static async verify(identifier: string, verificationCode: string) {
    const response = await fetch(`${await this.base()}/auth/verify`, {
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
    const raw = await this.makeAuthenticatedRequest<any>('/user/dashboard');
    // Normalize backend shapes (main.py vs ORM router)
    const normalizeCourse = (c: any) => ({
      course_id: c.course_id ?? c.id,
      course_title: c.course_title ?? c.title ?? 'Course',
      description: c.description ?? '',
      thumbnail_url: c.thumbnail_url ?? undefined,
      category: c.category ?? 'General',
      difficulty: c.difficulty ?? 'Beginner',
      progress_percentage: c.progress_percentage ?? 0,
      overall_progress_percentage: c.overall_progress_percentage ?? c.progress_percentage ?? 0,
      is_new: c.is_new ?? false,
      is_continue_available: c.is_continue_available ?? (c.progress_percentage ? c.progress_percentage > 0 : false),
    });
    const normalizedUser = (() => {
      const u = raw.user || {};
      return {
        id: u.id ?? '',
        email: u.email ?? '',
        name: u.name ?? '',
        role: Array.isArray(u.roles) && u.roles.length ? u.roles[0] : (u.role ?? 'student'),
        verified: u.is_verified ?? u.verified ?? false,
      } as User;
    })();
    const normalized = {
      user: normalizedUser,
      last_visited_course: raw.last_visited_course
        ? {
            course_id: raw.last_visited_course.course_id,
            course_title: raw.last_visited_course.course_title ?? raw.last_visited_course.title ?? 'Course',
            thumbnail_url: raw.last_visited_course.thumbnail_url,
            last_visited_module_id: raw.last_visited_course.last_visited_module_id,
            last_visited_module_title: raw.last_visited_course.last_visited_module_title,
            overall_progress_percentage:
              raw.last_visited_course.overall_progress_percentage ?? raw.last_visited_course.progress_percentage ?? 0,
            continue_url: raw.last_visited_course.continue_url ?? '',
          }
        : undefined,
      available_courses: Array.isArray(raw.available_courses) ? raw.available_courses.map(normalizeCourse) : [],
    };
    return normalized;
  }

  static async getProfile() {
    return this.makeAuthenticatedRequest<any>('/user/profile');
  }

  // Social auth
  static async socialAuth(provider: string, accessToken: string): Promise<AuthResponse> {
    const response = await fetch(`${await this.base()}/auth/social`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        provider,
        access_token: accessToken,
      }),
    });
    
    const data = await this.handleResponse(response);
    
    // Store tokens if provided
    if (data.auth_token) {
      await AsyncStorage.setItem('regod_access_token', data.auth_token);
      await AsyncStorage.setItem('regod_refresh_token', data.refresh_token);
    }
    
    return data;
  }

  // Course endpoints
  static async getCourses(): Promise<Course[]> {
    return this.makeAuthenticatedRequest<Course[]>('/courses');
  }

  static async getCourseModules(courseId: number): Promise<Module[]> {
    return this.makeAuthenticatedRequest<Module[]>(`/courses/${courseId}/modules`);
  }

  static async getCourseChapters(courseId: number): Promise<Chapter[]> {
    return this.makeAuthenticatedRequest<Chapter[]>(`/courses/${courseId}/chapters`);
  }

  static async getChapterProgress(courseId: number): Promise<{
    course_id: number;
    chapters: Array<{
      chapter_id: number;
      chapter_title: string;
      cover_image_url?: string;
      order: number;
      total_modules: number;
      completed_modules: number;
      progress_percentage: number;
      is_completed: boolean;
      next_module?: {
        id: number;
        title: string;
        description?: string;
        header_image_url?: string;
      };
    }>;
  }> {
    return this.makeAuthenticatedRequest(`/courses/${courseId}/chapter-progress`);
  }

  static async updateCourseProgress(courseId: number, progressPercentage: number | null, lastVisitedModuleId?: number, status: 'visited' | 'completed' = 'visited') {
    // Always try to update progress, even without module ID for overall progress
    const requestBody: any = {
      course_id: String(courseId),
      module_id: lastVisitedModuleId ? String(lastVisitedModuleId) : null,
      status,
    };
    
    // Only include progress_percentage if provided (let backend calculate if null)
    if (progressPercentage !== null) {
      requestBody.progress_percentage = progressPercentage;
    }
    
    return this.makeAuthenticatedRequest('/learn/progress', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // New endpoint for marking lessons as completed with responses
  static async completeLesson(courseId: number, moduleId: number, responses: any[]) {
    return this.makeAuthenticatedRequest('/learn/complete-lesson', {
      method: 'POST',
      body: JSON.stringify({
        course_id: String(courseId),
        module_id: String(moduleId),
        responses,
        completed_at: new Date().toISOString(),
      }),
    });
  }

  // Notes endpoints
  static async getNotes(): Promise<Note[]> {
    try {
      const data = await this.makeAuthenticatedRequest<any>('/user/notes');
      // Backend returns { notes: [{ note_content, course_title, created_at }] }
      const notes = (data.notes || []) as any[];
      return notes.map((n, idx) => ({
        id: Number(new Date(n.created_at).getTime() || idx),
        user_id: '',
        course_id: 0,
        lesson_id: 0,
        note_content: n.note_content,
        created_at: n.created_at,
        updated_at: n.created_at,
        course_title: n.course_title || 'General',
        lesson_title: n.course_title || 'Note',
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      return []; // Return empty array on error
    }
  }

  static async createNote(courseId: number, lessonId: number, content: string): Promise<Note> {
    try {
      const data = await this.makeAuthenticatedRequest<Note>('/user/notes', {
        method: 'POST',
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          note_content: content,
        }),
      });
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      // If backend not implemented, synthesize local note
      const now = new Date().toISOString();
      return {
        id: Number(new Date(now).getTime()),
        user_id: '',
        course_id: courseId,
        lesson_id: lessonId,
        note_content: content,
        created_at: now,
        updated_at: now,
        course_title: 'General',
        lesson_title: 'Note',
      };
    }
  }

  static async updateNote(noteId: number, courseId: number, lessonId: number, content: string): Promise<Note> {
    try {
      const data = await this.makeAuthenticatedRequest<Note>(`/user/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          note_content: content,
        }),
      });
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      const now = new Date().toISOString();
      return {
        id: noteId,
        user_id: '',
        course_id: courseId,
        lesson_id: lessonId,
        note_content: content,
        created_at: now,
        updated_at: now,
        course_title: 'General',
        lesson_title: 'Note',
      };
    }
  }

  static async deleteNote(noteId: number) {
    try {
      return await this.makeAuthenticatedRequest(`/user/notes/${noteId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      // Fallback: treat as deleted locally
      return { success: true };
    }
  }

  // Chat endpoints (match backend /api/connect/*)
  static async sendChatMessage(message: string): Promise<ChatResponse> {
    // Ensure a thread exists and get its id
    const thread = await this.getOrCreateThread();
    const data = await this.makeAuthenticatedRequest<any>('/connect/thread/messages', {
      method: 'POST',
      body: JSON.stringify({
        thread_id: thread.thread_id,
        content: message,
      }),
    });
    return { message: data.message || data.content } as ChatResponse;
  }

  static async getChatHistory(): Promise<Message[]> {
    const thread = await this.getOrCreateThread();
    const data = await this.makeAuthenticatedRequest<any>(`/connect/thread/messages?thread_id=${encodeURIComponent(thread.thread_id)}`);
    const list = (data.messages || []) as any[];
    return list.map((msg, idx) => ({
      id: String(idx),
      text: msg.content,
      sender: msg.sender_name === 'You' ? 'user' : 'assistant',
      timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }

  private static async getOrCreateThread(): Promise<{ thread_id: string; recipient_name?: string; unread_count?: number }> {
    return this.makeAuthenticatedRequest('/connect/thread');
  }

  // Favourites endpoints (spelling per backend)
  static async getFavorites(): Promise<any[]> {
    return this.makeAuthenticatedRequest<any[]>('/user/favourites');
  }

  static async toggleFavorite(lessonId: number) {
    return this.makeAuthenticatedRequest(`/user/favourites/${lessonId}`, {
      method: 'POST',
    });
  }

  static async removeFromFavorites(favoriteId: number) {
    return this.makeAuthenticatedRequest(`/user/favourites/${favoriteId}`, {
      method: 'DELETE',
    });
  }

  // Profile endpoints
  static async updateProfile(updateData: Partial<User>) {
    return this.makeAuthenticatedRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Admin endpoints (if user is admin)
  static async getAdminStats() {
    return this.makeAuthenticatedRequest('/admin/stats');
  }

  static async getTeachersDirectory() {
    return this.makeAuthenticatedRequest('/admin/teachers');
  }

  // Teacher code endpoints
  static async useTeacherCode(code: string): Promise<{ success: boolean; message: string; teacher_name?: string }> {
    return this.makeAuthenticatedRequest('/use-teacher-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Favorites endpoints
  static async toggleChapterFavorite(chapterId: number): Promise<{ action: string; chapter_id: number }> {
    return this.makeAuthenticatedRequest(`/user/chapter-favourites/${chapterId}`, {
      method: 'POST',
    });
  }

  static async getChapterFavorites(): Promise<Array<{
    id: number;
    user_id: string;
    chapter_id: number;
    created_at: string;
    chapter_title: string;
    course_title: string;
    cover_image_url?: string;
    progress_percentage: number;
    completed_modules: number;
    total_modules: number;
  }>> {
    return this.makeAuthenticatedRequest('/user/chapter-favourites');
  }

  static async deleteChapterFavorite(favoriteId: number): Promise<{ message: string }> {
    return this.makeAuthenticatedRequest(`/user/chapter-favourites/${favoriteId}`, {
      method: 'DELETE',
    });
  }

  // Utility methods
  static async refreshToken(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem('regod_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${await this.base()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await this.handleResponse(response);
    
    // Update stored tokens
    await AsyncStorage.setItem('regod_access_token', data.auth_token);
    await AsyncStorage.setItem('regod_refresh_token', data.refresh_token);
    
    return data.auth_token;
  }

  static async clearTokens() {
    console.log('Clearing all stored tokens');
    await AsyncStorage.removeItem('regod_access_token');
    await AsyncStorage.removeItem('regod_refresh_token');
    await AsyncStorage.removeItem('regod_user_data');
    await AsyncStorage.removeItem('clerk_session_token');
  }

  static async setClerkToken(token: string): Promise<void> {
    await AsyncStorage.setItem('clerk_session_token', token);
  }

  static isTokenExpiringSoon(token: string, minutesAhead: number = 5): boolean {
    try {
      // For Clerk session tokens, we can't decode them, so we'll assume they're valid
      // This method is mainly for backward compatibility
      return false;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }


  static async refreshTokenIfNeeded(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('regod_refresh_token');
      if (!refreshToken) {
        console.log('No refresh token available');
        return null;
      }

      const response = await fetch(`${await this.base()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return null;
      }

      const data = await response.json();
      
      // Store new tokens
      await AsyncStorage.setItem('regod_access_token', data.auth_token);
      await AsyncStorage.setItem('regod_refresh_token', data.refresh_token);
      
      // Update user data if provided
      if (data.user_data) {
        await AsyncStorage.setItem('regod_user_data', JSON.stringify(data.user_data));
      }
      
      console.log('Token refreshed successfully');
      return data.auth_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  static async debugJWTToken(token: string): Promise<any> {
    try {
      const response = await fetch(`${await this.base()}/auth/debug-jwt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      console.log('JWT Debug result:', result);
      return result;
    } catch (error) {
      console.error('JWT Debug failed:', error);
      return { error: 'Debug failed', success: false };
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      // Check for access token first
      let token = await AsyncStorage.getItem('regod_access_token');
      
      if (token) {
        return true;
      }
      
      // Fallback to refresh token
      token = await AsyncStorage.getItem('regod_refresh_token');
      if (token) {
        // Try to refresh the access token
        const newToken = await this.refreshTokenIfNeeded();
        return !!newToken;
      }
      
      // Fallback to Clerk session token for backward compatibility
      token = await AsyncStorage.getItem('clerk_session_token');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  static async getStoredToken(): Promise<string | null> {
    // Try access token first
    let token = await AsyncStorage.getItem('regod_access_token');
    if (token) return token;
    
    // Fallback to Clerk session token
    return await AsyncStorage.getItem('clerk_session_token');
  }
}

export default ApiService;
export type { User, Course, Chapter, Module, Note, DashboardResponse, Message, ChatResponse };