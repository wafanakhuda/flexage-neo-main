import axios from 'axios';

// Base API URL - update this with your actual backend URL
// export const BASE_URL = 'https://flexage-backend.vercel.app';
export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// export const BASE_URL = 'http://localhost:8000'; // Use this for local development

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('flexage_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('flexage_token');
      localStorage.removeItem('flexage_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types for FlexAGE API
export interface UserResponse {
  user_id: string;
  username: string;
  email?: string;
  full_name?: string;
  role: 'student' | 'configurator' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserCreate {
  username: string;
  email?: string;
  full_name?: string;
  role: 'student' | 'configurator' | 'admin';
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface FlexAGECompResponse {
  comp_id: string;
  comp_name: string;
  general_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface FlexAGECompCreate {
  comp_name: string;
  general_instructions?: string;
}

export interface FlexAGECompUpdate {
  comp_name?: string;
  general_instructions?: string;
}

export interface EntryResponse {
  entry_id: string;
  flex_age_comp_id: string;
  entry_title: string;
  instructions?: string;
  rubric_definition?: any;
  created_at: string;
  updated_at: string;
}

export interface EntryCreate {
  flex_age_comp_id: string;
  entry_title: string;
  instructions?: string;
  rubric_definition?: any;
}

export interface EntryUpdate {
  entry_title?: string;
  instructions?: string;
  rubric_definition?: any;
}

export interface StudentEntryStateResponse {
  state_id: string;
  entry_id: string;
  student_user_id: string;
  status: 'not_submitted' | 'submitted_processing' | 'outcome_available';
  created_at: string;
  updated_at: string;
}

export interface StudentEntryStateWithSubmission extends StudentEntryStateResponse {
  submission?: SubmissionWithOutcome;
}

export interface SubmissionResponse {
  submission_id: string;
  entry_id: string;
  student_user_id: string;
  student_name: string;
  submission_title: string;
  content: string;
  submitted_at: string;
}

export interface SubmissionCreate {
  entry_id: string;
  student_user_id: string;
  submission_title: string;
  content: string;
}

export interface SubmissionWithOutcome extends SubmissionResponse {
  outcome?: OutcomeResponse;
}

export interface OutcomeResponse {
  outcome_id: string;
  submission_id: string;
  outcome_data: {
    feedback_text: string;
    score: number;
    llm_confidence: number;
  };
  is_llm_generated: boolean;
  generated_at: string;
}

export interface OutcomeUpdate {
  outcome_data?: {
    feedback_text?: string;
    score?: number;
    llm_confidence?: number;
  };
  is_llm_generated?: boolean;
}

export interface EntryWithStudentStateWithSubmission {
  entry_id: string;
  flex_age_comp_id: string;
  entry_title: string;
  instructions?: string;
  rubric_definition?: any;
  created_at: string;
  updated_at: string;
  student_state?: {
    state_id: string;
    entry_id: string;
    student_user_id: string;
    status: 'not_submitted' | 'submitted_processing' | 'outcome_available';
    created_at: string;
    updated_at: string;
    submission?: SubmissionResponse;
  };
}

export interface StudentEnrollmentCreate {
  student_user_id: string;
  flex_age_comp_id: string;
}

export interface HTTPValidationError {
  detail: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

// Authentication API
export const authAPI = {
  // Login using JSON payload
  login: async (credentials: UserLogin): Promise<Token> => {
    const response = await apiClient.post('/api/auth/login/json', credentials);
    return response.data;
  },

  // Get current user details
  me: async (): Promise<UserResponse> => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  // Register new user (admin/configurator only)
  register: async (userData: UserCreate): Promise<UserResponse> => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  // Get all users (admin/configurator only)
  getUsers: async (skip: number = 0, limit: number = 100): Promise<UserResponse[]> => {
    const response = await apiClient.get('/api/auth/users', {
      params: { skip, limit }
    });
    return response.data;
  },

  // Enroll student
  enroll: async (enrollment: StudentEnrollmentCreate): Promise<void> => {
    await apiClient.post('/api/auth/enroll', enrollment);
  },

  // Unenroll student
  unenroll: async (enrollment: StudentEnrollmentCreate): Promise<void> => {
    await apiClient.delete('/api/auth/enroll', { data: enrollment });
  },
};

// Configuration API (admin/configurator only)
export const configAPI = {
  // FlexAGEComp management
  getFlexAGEComps: async (skip: number = 0, limit: number = 100): Promise<FlexAGECompResponse[]> => {
    const response = await apiClient.get('/api/configure/flexagecomps/', {
      params: { skip, limit }
    });
    return response.data;
  },

  getFlexAGEComp: async (compId: string): Promise<FlexAGECompResponse> => {
    const response = await apiClient.get(`/api/configure/flexagecomps/${compId}`);
    return response.data;
  },

  createFlexAGEComp: async (compData: FlexAGECompCreate): Promise<FlexAGECompResponse> => {
    const response = await apiClient.post('/api/configure/flexagecomps/', compData);
    return response.data;
  },

  updateFlexAGEComp: async (compId: string, compData: FlexAGECompUpdate): Promise<FlexAGECompResponse> => {
    const response = await apiClient.put(`/api/configure/flexagecomps/${compId}`, compData);
    return response.data;
  },

  deleteFlexAGEComp: async (compId: string): Promise<void> => {
    await apiClient.delete(`/api/configure/flexagecomps/${compId}`);
  },

  // Get enrolled students for a FlexAGEComp
  getEnrolledStudents: async (compId: string): Promise<UserResponse[]> => {
    const response = await apiClient.get(`/api/configure/flexagecomps/${compId}/enrolled_students`);
    return response.data;
  },

  // Entry management
  getEntries: async (compId: string, skip: number = 0, limit: number = 100): Promise<EntryResponse[]> => {
    const response = await apiClient.get(`/api/configure/flexagecomps/${compId}/entries`, {
      params: { skip, limit }
    });
    return response.data;
  },

  getEntry: async (entryId: string): Promise<EntryResponse> => {
    const response = await apiClient.get(`/api/configure/entries/${entryId}`);
    return response.data;
  },

  createEntry: async (entryData: EntryCreate): Promise<EntryResponse> => {
    const response = await apiClient.post('/api/configure/entries/', entryData);
    return response.data;
  },

  updateEntry: async (entryId: string, entryData: EntryUpdate): Promise<EntryResponse> => {
    const response = await apiClient.put(`/api/configure/entries/${entryId}`, entryData);
    return response.data;
  },

  deleteEntry: async (entryId: string): Promise<void> => {
    await apiClient.delete(`/api/configure/entries/${entryId}`);
  },

  // Student states for entries
  getStudentStates: async (entryId: string): Promise<StudentEntryStateWithSubmission[]> => {
    const response = await apiClient.get(`/api/configure/entries/${entryId}/student_states`);
    return response.data;
  },

  // Submissions management
  getSubmissions: async (entryId: string): Promise<SubmissionWithOutcome[]> => {
    const response = await apiClient.get(`/api/configure/entries/${entryId}/submissions`);
    return response.data;
  },

  getSubmission: async (submissionId: string): Promise<SubmissionWithOutcome> => {
    const response = await apiClient.get(`/api/configure/submissions/${submissionId}`);
    return response.data;
  },

  generateOutcome: async (submissionId: string, forceRegenerate: boolean = false): Promise<void> => {
    const params = forceRegenerate ? '?force_regenerate=true' : '';
    await apiClient.post(`/api/configure/submissions/${submissionId}/generate_outcome${params}`);
  },

  // Update outcome
  updateOutcome: async (outcomeId: string, outcomeData: OutcomeUpdate): Promise<OutcomeResponse> => {
    const response = await apiClient.put(`/api/configure/outcomes/${outcomeId}`, outcomeData);
    return response.data;
  },
};

// Student API
export const studentAPI = {
  // Get enrolled FlexAGEComps
  getFlexAGEComps: async (skip: number = 0, limit: number = 100): Promise<FlexAGECompResponse[]> => {
    const response = await apiClient.get('/api/student/flexagecomps', {
      params: { skip, limit }
    });
    return response.data;
  },

  // Get entries for a component with student state
  getEntries: async (compId: string): Promise<EntryWithStudentStateWithSubmission[]> => {
    const response = await apiClient.get(`/api/student/flexagecomps/${compId}/entries`);
    return response.data;
  },

  // Get single entry details
  getEntry: async (entryId: string): Promise<EntryResponse> => {
    const response = await apiClient.get(`/api/student/entries/${entryId}`);
    return response.data;
  },

  // Submit entry
  submitEntry: async (entryId: string, submission: {
    submission_title: string;
    content: string;
  }): Promise<SubmissionResponse> => {
    const response = await apiClient.post(`/api/student/entries/${entryId}/submit`, submission);
    return response.data;
  },

  // Get submission with outcome
  getSubmission: async (submissionId: string): Promise<SubmissionWithOutcome> => {
    const response = await apiClient.get(`/api/student/submissions/${submissionId}`);
    return response.data;
  },
  
  // Get all submissions for an entry (for current student)
  getSubmissionsForEntry: async (entryId: string): Promise<SubmissionWithOutcome[]> => {
    const response = await apiClient.get(`/api/student/entries/${entryId}/submissions`);
    return response.data;
  },
  
  // Get entry state for a student (from configurator perspective)
  getStudentEntryStateForEntry: async (studentUserId: string, entryId: string): Promise<StudentEntryStateWithSubmission> => {
    // Use the configurator endpoint to get all student states for the entry, then filter by student
    const response = await apiClient.get(`/api/configure/entries/${entryId}/student_states`);
    const allStates: StudentEntryStateWithSubmission[] = response.data;
    
    // Find the state for the specific student
    const studentState = allStates.find(state => state.student_user_id === studentUserId);
    
    if (!studentState) {
      throw new Error(`No entry state found for student ${studentUserId} in entry ${entryId}`);
    }
    
    return studentState;
  },
};

// Export the configured axios instance for custom requests
export { apiClient };