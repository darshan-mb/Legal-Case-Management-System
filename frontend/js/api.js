const API_URL = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.setToken(data.token);
        return data;
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    // Case endpoints
    async getCases() {
        return await this.request('/cases');
    }

    async getCase(id) {
        return await this.request(`/cases/${id}`);
    }

    async createCase(caseData) {
        return await this.request('/cases', {
            method: 'POST',
            body: JSON.stringify(caseData)
        });
    }

    async updateCase(id, caseData) {
        return await this.request(`/cases/${id}`, {
            method: 'PUT',
            body: JSON.stringify(caseData)
        });
    }

    // Document endpoints
    async getCaseDocuments(caseId) {
        return await this.request(`/documents/case/${caseId}`);
    }

    async uploadDocument(formData) {
        return await this.request('/documents', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
    }

    // Calendar endpoints
    async getAdvocateHearings() {
        return await this.request('/calendar/advocate-hearings');
    }

    async getClientHearings() {
        return await this.request('/calendar/client-hearings');
    }

    async updateHearingDate(caseId, nextHearingDate) {
        return await this.request(`/calendar/update-hearing/${caseId}`, {
            method: 'PUT',
            body: JSON.stringify({ nextHearingDate })
        });
    }
}

const api = new ApiService(); 