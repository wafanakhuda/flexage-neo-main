# Frontend Architecture

## Overview

The FlexAGE frontend is built using Next.js 14 with the App Router, providing a modern React-based user interface with TypeScript for type safety. The application follows a component-based architecture with clear separation between different user roles and functionalities.

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (built on Radix UI)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Rich Text Editor**: Pell Editor
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts)

## Project Structure

```
frontend/
├── app/                        # Next.js App Router directory
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout component
│   ├── page.tsx               # Home page (redirects to appropriate dashboard)
│   ├── login/                 # Authentication
│   │   └── page.tsx           # Login page
│   ├── configure/             # Configurator/Admin interface
│   │   ├── layout.tsx         # Configure layout with navigation
│   │   ├── page.tsx           # Redirects to flexagecomps
│   │   ├── flexagecomps/      # FlexAGE Component management
│   │   │   ├── page.tsx       # Component list
│   │   │   └── [comp_id]/     # Dynamic component routes
│   │   │       ├── entries/   # Entry management
│   │   │       │   └── page.tsx
│   │   │       └── enrollments/ # Student enrollment
│   │   │           └── page.tsx
│   │   ├── entries/           # Entry detail management
│   │   │   └── [entry_id]/
│   │   │       └── submissions/
│   │   │           └── page.tsx
│   │   └── users/             # User management (admin only)
│   │       └── page.tsx
│   └── student/               # Student interface
│       ├── layout.tsx         # Student layout
│       ├── page.tsx           # Student dashboard
│       ├── entries/           # Entry submission interface
│       │   └── [entry_id]/
│       │       └── submit/
│       │           └── page.tsx
│       └── flexagecomps/      # Student component view
│           └── [comp_id]/
│               └── entries/
│                   └── page.tsx
├── components/                # Reusable UI components
│   ├── ui/                    # Shadcn/ui base components
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   ├── edit-outcome-dialog.tsx  # Outcome editing modal
│   ├── feedback-display.tsx     # Feedback display component
│   ├── pell-editor.tsx         # Rich text editor wrapper
│   ├── RubricEditor.tsx        # Rubric creation/editing
│   ├── RubricDataLoader.tsx    # Rubric data import
│   └── RubricViewer.tsx        # Rubric display
├── lib/                       # Utility libraries
│   ├── auth-context.tsx       # Authentication context provider
│   ├── protected-route.tsx    # Route protection utilities
│   ├── utils.ts               # General utilities
│   └── debug-utils.ts         # Development debugging tools
├── services/                  # API communication
│   └── api.ts                 # Centralized API client
├── public/                    # Static assets
├── next.config.mjs           # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Core Architecture Patterns

### 1. App Router Structure

The application uses Next.js 14's App Router with file-based routing:

```typescript
// app/layout.tsx - Root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 2. Role-Based Layouts

#### Configure Layout (Configurator/Admin)
```typescript
// app/configure/layout.tsx
export default function ConfigureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  
  // Authentication and role checking
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && user?.role === 'student') {
      router.push('/student');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">FlexAGE Configuration</h1>
            <p className="text-sm text-slate-600">
              Welcome, {user.full_name || user.username} ({user.role})
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <Link href="/configure/flexagecomps" className={navLinkStyles}>
                    Components
                  </Link>
                </li>
                {user.role === 'admin' && (
                  <li>
                    <Link href="/configure/users" className={navLinkStyles}>
                      Users
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
```

#### Student Layout
```typescript
// app/student/layout.tsx
export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && user?.role !== 'student') {
      router.push('/configure/flexagecomps');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900">
            Welcome, {user.full_name || user.username}!
          </h1>
          
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
```

### 3. Authentication Context

```typescript
// lib/auth-context.tsx
interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('flexage_token');
    const storedUser = localStorage.getItem('flexage_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const tokenResponse = await authAPI.login({ username, password });
      const userData = await authAPI.me();
      
      localStorage.setItem('flexage_token', tokenResponse.access_token);
      localStorage.setItem('flexage_user', JSON.stringify(userData));
      
      setToken(tokenResponse.access_token);
      setUser(userData);
      
      // Redirect based on role
      if (userData.role === 'student') {
        router.push('/student/dashboard');
      } else if (userData.role === 'configurator' || userData.role === 'admin') {
        router.push('/configure/flexagecomps');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('flexage_token');
    localStorage.removeItem('flexage_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 4. API Client Architecture

```typescript
// services/api.ts
import axios from 'axios';

export const BASE_URL = 'https://flexage-backend.vercel.app';

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

// API service objects
export const authAPI = {
  login: async (credentials: UserLogin): Promise<Token> => {
    const response = await apiClient.post('/api/auth/login/json', credentials);
    return response.data;
  },
  
  me: async (): Promise<UserResponse> => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },
  
  // ... other auth methods
};

export const configAPI = {
  getFlexAGEComps: async (skip: number = 0, limit: number = 100): Promise<FlexAGECompResponse[]> => {
    const response = await apiClient.get('/api/configure/flexagecomps/', {
      params: { skip, limit }
    });
    return response.data;
  },
  
  // ... other config methods
};

export const studentAPI = {
  getFlexAGEComps: async (): Promise<FlexAGECompResponse[]> => {
    const response = await apiClient.get('/api/student/flexagecomps');
    return response.data;
  },
  
  // ... other student methods
};
```

## Key Components

### 1. Rubric Editor

```typescript
// components/RubricEditor.tsx
interface RubricDefinition {
  criteria: Criterion[];
  performance_levels: PerformanceLevel[];
  cell_descriptions: string[][];
}

const RubricEditor: React.FC<RubricEditorProps> = ({ initialDefinition, onChange }) => {
  const [definition, setDefinition] = useState<RubricDefinition>(
    initialDefinition || defaultRubricDefinition
  );

  const handleCriterionChange = (index: number, field: 'text' | 'marks', value: string | number) => {
    const newCriteria = definition.criteria.map((crit, i) => {
      if (i === index) {
        return { ...crit, [field]: value };
      }
      return crit;
    });
    
    const newDefinition = { ...definition, criteria: newCriteria };
    setDefinition(newDefinition);
    onChange(newDefinition);
  };

  // Component renders a grid-based rubric editor
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Criteria editing */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Criteria</h3>
          {definition.criteria.map((criterion, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <Input
                value={criterion.text}
                onChange={(e) => handleCriterionChange(index, 'text', e.target.value)}
                placeholder="Criterion description"
              />
              <Input
                type="number"
                value={criterion.marks}
                onChange={(e) => handleCriterionChange(index, 'marks', parseInt(e.target.value) || 0)}
                placeholder="Marks"
                className="w-20"
              />
            </div>
          ))}
        </div>
        
        {/* Performance levels editing */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Performance Levels</h3>
          {definition.performance_levels.map((level, index) => (
            <Input
              key={index}
              value={level.text}
              onChange={(e) => handlePerformanceLevelChange(index, e.target.value)}
              placeholder="Performance level"
              className="mb-2"
            />
          ))}
        </div>
      </div>
      
      {/* Rubric grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          {/* Table implementation */}
        </table>
      </div>
    </div>
  );
};
```

### 2. Rich Text Editor Wrapper

```typescript
// components/pell-editor.tsx
interface PellEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const PellEditor: React.FC<PellEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Enter your text here...",
  className = ""
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && editorRef.current) {
      import('pell').then((pell) => {
        const editorInstance = pell.init({
          element: editorRef.current!,
          onChange: (html: string) => onChange(html),
          defaultParagraphSeparator: 'p',
          styleWithCSS: false,
          actions: [
            'bold', 'italic', 'underline', 'strikethrough',
            'heading1', 'heading2', 'paragraph',
            'quote', 'olist', 'ulist', 'code', 'line'
          ],
          classes: {
            actionbar: 'pell-actionbar border-b border-gray-200 p-2',
            button: 'pell-button px-2 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-100',
            content: 'pell-content p-4 min-h-[200px] outline-none'
          }
        });
        
        setEditor(editorInstance);
        
        if (value && editorInstance.content) {
          editorInstance.content.innerHTML = value;
        }
      });
    }

    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, []);

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      <div ref={editorRef} />
    </div>
  );
};
```

### 3. Student Dashboard

```typescript
// app/student/page.tsx
export default function StudentDashboard() {
  const [components, setComponents] = useState<FlexAGECompResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setIsLoading(true);
        const data = await studentAPI.getFlexAGEComps();
        setComponents(data);
      } catch (err: any) {
        console.error('Error fetching components:', err);
        setError(err.response?.data?.detail || 'Failed to load components');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, []);

  const handleViewEntries = (compId: string) => {
    router.push(`/student/flexagecomps/${compId}/entries`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading your components...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Enrolled Components</h2>
        <p className="text-slate-600">Select a component to view and complete its entries.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {components.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-slate-600 mb-2">You are not enrolled in any components.</p>
            <p className="text-sm text-slate-500">
              Contact your instructor or administrator to get enrolled in FlexAGE components.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {components.map((component) => (
            <Card key={component.comp_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{component.comp_name}</CardTitle>
                {component.general_instructions && (
                  <CardDescription className="line-clamp-3">
                    {component.general_instructions}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleViewEntries(component.comp_id)}
                    className="w-full"
                  >
                    View Entries
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. Entry Submission Interface

```typescript
// app/student/entries/[entry_id]/submit/page.tsx
export default function EntrySubmissionPage() {
  const [entry, setEntry] = useState<EntryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    submission_title: '',
    content: '',
  });
  
  const params = useParams();
  const router = useRouter();
  const entryId = params.entry_id as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.submission_title.trim() || !formData.content.trim()) {
      setError('Both title and content are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await studentAPI.submitEntry(entryId, {
        submission_title: formData.submission_title.trim(),
        content: formData.content.trim(),
      });
      
      // Redirect back to the entries list with success message
      router.push(`/student/flexagecomps/${entry?.flex_age_comp_id}/entries?submitted=true`);
    } catch (err: any) {
      console.error('Error submitting entry:', err);
      setError(err.response?.data?.detail || 'Failed to submit entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Form implementation */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Response</CardTitle>
            <CardDescription>
              Complete your submission for this entry. You can submit multiple times if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="submission_title">Submission Title</Label>
              <Input
                id="submission_title"
                value={formData.submission_title}
                onChange={(e) => setFormData(prev => ({ ...prev, submission_title: e.target.value }))}
                placeholder="Enter a title for your submission"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="content">Your Response</Label>
              <PellEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Write your response here..."
                className="mt-2"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Response
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
```

## State Management Patterns

### 1. Local State with Hooks
Most components use React hooks for local state management:

```typescript
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DataType[]>([]);
```

### 2. Context for Authentication
Global authentication state is managed through React Context:

```typescript
const { user, isAuthenticated, isLoading, login, logout } = useAuth();
```

### 3. Form State Management
Form handling with controlled components:

```typescript
const [formData, setFormData] = useState({
  field1: '',
  field2: '',
});

const handleInputChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

## Styling and UI System

### 1. Tailwind CSS
Utility-first CSS framework for consistent styling:

```typescript
<div className="min-h-screen bg-slate-50">
  <header className="bg-white border-b border-slate-200">
    <div className="container mx-auto px-4 py-4">
      {/* Content */}
    </div>
  </header>
</div>
```

### 2. Shadcn/ui Components
Pre-built accessible components:

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

<Card className="hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle>Component Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="outline" size="sm">
      Action
    </Button>
  </CardContent>
</Card>
```

## Routing and Navigation

### 1. File-Based Routing
Next.js App Router provides automatic routing based on file structure:

- `/app/page.tsx` → `/`
- `/app/login/page.tsx` → `/login`
- `/app/student/page.tsx` → `/student`
- `/app/configure/flexagecomps/[comp_id]/entries/page.tsx` → `/configure/flexagecomps/123/entries`

### 2. Dynamic Routes
```typescript
// app/student/flexagecomps/[comp_id]/entries/page.tsx
export default function StudentEntriesPage() {
  const params = useParams();
  const compId = params.comp_id as string;
  
  // Use compId to fetch data
}
```

### 3. Programmatic Navigation
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate to different routes
router.push('/student/dashboard');
router.back();
router.replace('/login');
```

## Error Handling Patterns

### 1. API Error Handling
```typescript
try {
  const data = await api.fetchData();
  setData(data);
} catch (err: any) {
  console.error('Error fetching data:', err);
  
  // Handle different error response formats
  let errorMessage = 'An error occurred';
  if (err.response?.data?.detail) {
    errorMessage = err.response.data.detail;
  } else if (err.message) {
    errorMessage = err.message;
  }
  
  setError(errorMessage);
}
```

### 2. Form Validation
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Client-side validation
  if (!formData.title.trim()) {
    setError('Title is required');
    return;
  }
  
  if (formData.content.length < 10) {
    setError('Content must be at least 10 characters');
    return;
  }
  
  // Submit form
  try {
    await submitData(formData);
    setSuccess('Data submitted successfully');
  } catch (error) {
    setError('Failed to submit data');
  }
};
```

## Performance Optimizations

### 1. Component Optimization
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  // Handle click
}, [dependency]);

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => expensiveTransform(item));
}, [data]);
```

### 2. Code Splitting
```typescript
// Dynamic imports for large components
const RubricEditor = dynamic(() => import('@/components/RubricEditor'), {
  loading: () => <div>Loading editor...</div>,
});
```

### 3. Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/images/logo.png"
  alt="FlexAGE Logo"
  width={200}
  height={100}
  priority
/>
```

This frontend architecture provides a scalable, maintainable, and performant user interface for the FlexAGE system with clear separation of concerns and modern React patterns.
