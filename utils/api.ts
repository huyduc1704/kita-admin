const API_BASE = '/api';

// ─── Token refresh queue ───────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });

  // 204 No Content
  if (res.status === 204) return undefined as T;

  // 401 → thử refresh token qua BFF route
  if (res.status === 401 && retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((ok) => {
          if (ok) resolve(request<T>(path, options, false));
          else reject(new Error('Session expired'));
        });
      });
    }

    isRefreshing = true;
    const refreshed = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });
    isRefreshing = false;

    if (refreshed.ok) {
      refreshQueue.forEach((cb) => cb(true));
      refreshQueue = [];
      return request<T>(path, options, false);
    } else {
      refreshQueue.forEach((cb) => cb(false));
      refreshQueue = [];
      if (typeof window !== 'undefined') {
        window.location.href = '/login?session_expired=true';
      }
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Đã có lỗi xảy ra' }));
    throw Object.assign(new Error(error.message || 'Request failed'), { status: res.status, data: error });
  }

  const text = await res.text();
  if (!text) return undefined as T;
  
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

const get  = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });
const put  = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) });
const del  = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ─── Types ────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSetting {
  id: number;
  companyName: string;
  taxCode: string | null;
  slogan: string | null;
  hotline: string | null;
  email: string | null;
  addressNorth: string | null;
  addressSouth: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  feedbackImageUrl: string | null;
  updatedAt: string;
  resolvedSocialButtons: SocialButton[];
}

export interface SocialButton {
  id: number;
  type: 'phone' | 'zalo' | 'messenger' | 'facebook' | 'tiktok' | 'youtube' | 'custom';
  value: string;
  label: string;
  iconUrl: string | null;
  position: 'floating' | 'footer' | 'both';
  order: number;
  isActive: boolean;
  resolvedLink: string;
}

export interface HeroSlide {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string;
  highlight: string;
  ctaText: string;
  ctaLink: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: number;
  slug: string;
  name: string;
  order: number;
  categoryCount: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  order: number;
  isActive: boolean;
  groupId: number;
  group: Group;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  type: 'project' | 'service' | 'news' | 'knowledge' | 'pricing';
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  thumbnailUrl: string | null;
  gallery: string[];
  metadata: Record<string, unknown> | null;
  views: number;
  isActive: boolean;
  publishedAt: string | null;
  order: number;
  categoryId: number | null;
  category: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConsultationLead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  requirement: 'build' | 'design' | 'interior' | 'consult' | null;
  area: string | null;
  province: string | null;
  detailNote: string | null;
  status: 'new' | 'contacted' | 'consulting' | 'done' | 'cancelled';
  adminNote: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  total: number;
  today: number;
  byStatus: Record<string, number>;
}

// ─── Auth API ─────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ message: string; admin: AdminUser }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false, // không retry 401 → tránh trigger refresh khi sai mật khẩu
    ),
  logout: () => post('/auth/logout'),
  getMe: () => get<AdminUser>('/auth/me'),
  refreshToken: () => post('/auth/refresh-token'),
  changePassword: (currentPassword: string, newPassword: string) =>
    put('/auth/change-password', { currentPassword, newPassword }),
};

// ─── Admin Accounts API ───────────────────────────────────────────────────

export const adminApi = {
  getAll: () => get<AdminUser[]>('/admin/accounts'),
  getOne: (id: number) => get<AdminUser>(`/admin/accounts/${id}`),
  create: (data: { email: string; password: string; fullName: string; role: string }) =>
    post<AdminUser>('/admin/accounts', data),
  update: (id: number, data: Partial<AdminUser>) =>
    put<AdminUser>(`/admin/accounts/${id}`, data),
  remove: (id: number) => del(`/admin/accounts/${id}`),
};

// ─── System Settings API ──────────────────────────────────────────────────

export const systemSettingsApi = {
  get: () => get<SystemSetting>('/system-settings'),
  update: (data: Partial<SystemSetting>) => put<SystemSetting>('/system-settings', data),
  uploadLogo: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return post<SystemSetting>('/system-settings/upload/logo', fd);
  },
  uploadFavicon: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return post<SystemSetting>('/system-settings/upload/favicon', fd);
  },
  uploadFeedbackImage: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return post<SystemSetting>('/system-settings/upload/feedback-image', fd);
  },
  // Social Buttons
  getSocialButtons: () => get<SocialButton[]>('/system-settings/social-buttons'),
  createSocialButton: (data: Partial<SocialButton>) =>
    post<SocialButton>('/system-settings/social-buttons', data),
  updateSocialButton: (id: number, data: Partial<SocialButton>) =>
    put<SocialButton>(`/system-settings/social-buttons/${id}`, data),
  uploadSocialIcon: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return post<SocialButton>(`/system-settings/social-buttons/${id}/icon`, fd);
  },
  reorderSocialButtons: (items: { id: number; order: number }[]) =>
    put('/system-settings/social-buttons/reorder', { items }),
  deleteSocialButton: (id: number) => del(`/system-settings/social-buttons/${id}`),
};

// ─── Hero Slides API ──────────────────────────────────────────────────────

export const heroSlidesApi = {
  getAll: (onlyActive = false) =>
    get<HeroSlide[]>(`/hero-slides${onlyActive ? '?active=true' : ''}`),
  getOne: (id: number) => get<HeroSlide>(`/hero-slides/${id}`),
  create: (data: Partial<HeroSlide>, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
    return post<HeroSlide>('/hero-slides', fd);
  },
  update: (id: number, data: Partial<HeroSlide>) =>
    put<HeroSlide>(`/hero-slides/${id}`, data),
  updateImage: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return put<HeroSlide>(`/hero-slides/${id}/image`, fd);
  },
  reorder: (items: { id: number; order: number }[]) =>
    put('/hero-slides/reorder', { items }),
  remove: (id: number) => del(`/hero-slides/${id}`),
};

// ─── Categories API ───────────────────────────────────────────────────────

export const categoriesApi = {
  getGroups: () => get<Group[]>('/categories/groups'),
  getAll: (params?: { group?: string; groupId?: number; active?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.group) q.set('group', params.group);
    if (params?.groupId) q.set('groupId', String(params.groupId));
    if (params?.active) q.set('active', 'true');
    return get<Category[]>(`/categories?${q.toString()}`);
  },
  create: (data: Partial<Category>) => post<Category>('/categories', data),
  update: (id: number, data: Partial<Category>) => put<Category>(`/categories/${id}`, data),
  uploadThumbnail: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return post<Category>(`/categories/${id}/thumbnail`, fd);
  },
  reorder: (items: { id: number; order: number }[]) =>
    put('/categories/reorder', { items }),
  remove: (id: number) => del(`/categories/${id}`),
};

// ─── Posts API ────────────────────────────────────────────────────────────

export const postsApi = {
  getAll: (params?: {
    type?: string; category?: string; categoryId?: number;
    search?: string; active?: boolean; page?: number; limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set('type', params.type);
    if (params?.category) q.set('category', params.category);
    if (params?.categoryId) q.set('categoryId', String(params.categoryId));
    if (params?.search) q.set('search', params.search);
    if (params?.active) q.set('active', 'true');
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return get<Paginated<Post>>(`/posts?${q.toString()}`);
  },
  getOne: (id: number) => get<Post>(`/posts/admin/${id}`),
  create: (data: Partial<Post> & { metadata?: string }, file?: File) => {
    const fd = new FormData();
    if (file) fd.append('file', file);
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
    return post<Post>('/posts', fd);
  },
  update: (id: number, data: Partial<Post> & { metadata?: string }) =>
    put<Post>(`/posts/${id}`, data),
  updateThumbnail: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return put<Post>(`/posts/${id}/thumbnail`, fd);
  },
  addGallery: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return post<Post>(`/posts/${id}/gallery`, fd);
  },
  removeGallery: (id: number, index: number) =>
    del<Post>(`/posts/${id}/gallery/${index}`),
  togglePublish: (id: number) => put<Post>(`/posts/${id}/toggle-publish`),
  remove: (id: number) => del(`/posts/${id}`),
};

// ─── Upload API ──────────────────────────────────────────────────────────

export const uploadApi = {
  image: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return post<{ url: string }>('/upload', fd);
  },
};

// ─── Consultation Leads API ───────────────────────────────────────────────

export const leadsApi = {
  getAll: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return get<Paginated<ConsultationLead>>(`/consultation-leads?${q.toString()}`);
  },
  getOne: (id: number) => get<ConsultationLead>(`/consultation-leads/${id}`),
  getStats: () => get<LeadStats>('/consultation-leads/stats'),
  updateStatus: (id: number, data: { status: string; adminNote?: string; assignedTo?: string }) =>
    put<ConsultationLead>(`/consultation-leads/${id}/status`, data),
  remove: (id: number) => del(`/consultation-leads/${id}`),
};
