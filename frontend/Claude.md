# Frontend Development Guidelines - MyHelper Platform

## UI/UX Design Philosophy

### Design Inspiration
- **Primary Inspiration**: Airbnb & Pinterest
- **Style**: Clean, modern, card-based layouts with ample white space
- **Typography**: Clear hierarchy, readable fonts, consistent sizing
- **Colors**: Soft, welcoming palette with accessible contrast ratios
- **Imagery**: High-quality, human-centered photography when applicable

### Branding Requirements
- **Logo Usage**: Always use the app logo (`/public/logo.svg`) instead of plain text "MyHelper"
- **Logo as Home Link**: The logo should always link back to the homepage
- **Logo Sizing**: Use responsive sizing (w-8 h-8 on mobile, w-10 h-10 on larger screens)

### Visual Principles
1. **White Space**: Generous padding and margins for breathing room
2. **Cards**: Rounded corners (12-16px), subtle shadows, hover effects
3. **Grid Systems**: Responsive masonry or uniform grid layouts
4. **Micro-interactions**: Smooth transitions, hover states, loading animations
5. **Accessibility**: WCAG 2.1 AA compliance minimum

### Interactive Elements
- **Cursor Pointer**: All clickable elements (buttons, links, onClick handlers) MUST have `cursor-pointer` class
- **Hover States**: All interactive elements should have visible hover feedback
- **Focus States**: Keyboard navigation must be supported with visible focus indicators

---

## Responsive Design Requirements

### Mandatory Responsiveness
**All pages, components, and changes MUST be fully responsive across all screen sizes.**

### Breakpoints
| Breakpoint | Screen Width | Device Type |
|------------|--------------|-------------|
| `sm` | ≥640px | Mobile landscape |
| `md` | ≥768px | Tablets |
| `lg` | ≥1024px | Small laptops |
| `xl` | ≥1280px | Desktops |
| `2xl` | ≥1536px | Large screens |

### Responsive Design Rules
1. **Mobile-First**: Always start with mobile styles, then add responsive classes
2. **No Horizontal Scroll**: Content must never cause horizontal scrolling on any device
3. **Touch-Friendly**: Buttons and interactive elements must be at least 44x44px on mobile
4. **Readable Text**: Font sizes must be legible on all screen sizes (min 14px on mobile)
5. **Flexible Images**: All images must scale proportionally with `max-width: 100%`
6. **Stack on Mobile**: Multi-column layouts should stack vertically on small screens
7. **Test All Breakpoints**: Every change must be tested at all breakpoint sizes

### Tailwind Responsive Classes Examples
```jsx
// Grid that stacks on mobile
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive text sizing
<h1 className="text-2xl md:text-4xl lg:text-5xl">

// Responsive padding/margin
<section className="px-4 md:px-8 lg:px-16 py-8 md:py-16">

// Hide/show based on screen size
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

---

## Internationalization (i18n)

### Multi-Language Support
**All UI text must support three languages:**
- 🇬🇧 **English** (en)
- 🇩🇪 **German** (de) - Primary language
- 🇫🇷 **French** (fr)

### Language Implementation Rules
1. **No Hardcoded Text**: Never use hardcoded strings in components
2. **Translation Keys**: Use descriptive translation keys (e.g., `auth.login.title`)
3. **Dynamic Content**: All user-facing text must be translatable
4. **Date/Number Formats**: Respect locale-specific formatting
5. **RTL Support**: While not required now, structure should allow for future RTL languages

### Translation File Structure
```
locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── dashboard.json
│   └── errors.json
├── de/
│   ├── common.json
│   ├── auth.json
│   ├── dashboard.json
│   └── errors.json
└── fr/
    ├── common.json
    ├── auth.json
    ├── dashboard.json
    └── errors.json
```

### Component Translation Example
```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';

const WelcomeComponent = () => {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.description')}</p>
    </div>
  );
};
```

### Translation JSON Example
```json
// locales/en/common.json
{
  "welcome": {
    "title": "Welcome to MyHelper",
    "description": "Find care or provide care services"
  }
}

// locales/de/common.json
{
  "welcome": {
    "title": "Willkommen bei MyHelper",
    "description": "Finden Sie Pflege oder bieten Sie Pflegedienste an"
  }
}

// locales/fr/common.json
{
  "welcome": {
    "title": "Bienvenue chez MyHelper",
    "description": "Trouvez des soins ou offrez des services de soins"
  }
}
```

---

## Component Architecture Rules

### Maximum Lines Rule
**Every component file must be ≤200 lines of code.**

When a component exceeds 200 lines:
1. Extract logical sub-components
2. Create a folder structure for the component
3. Use composition pattern

### Component Folder Structure
```
components/
├── ComponentName/
│   ├── index.tsx              # Main component (≤200 lines)
│   ├── ComponentName.tsx      # Alternative main export
│   ├── SubComponent1.tsx      # Sub-component (≤200 lines)
│   ├── SubComponent2.tsx      # Sub-component (≤200 lines)
│   ├── hooks/                 # Component-specific hooks
│   │   └── useComponentLogic.ts
│   ├── types.ts               # TypeScript interfaces
│   └── styles.module.css      # Component-specific styles (if needed)
```

### Component Template
```tsx
'use client';

import { FC } from 'react';
import SubComponent from './SubComponent';

interface ComponentNameProps {
  // Props definition
}

const ComponentName: FC<ComponentNameProps> = ({ ...props }) => {
  // Hooks (max 5-7 hooks before extracting to custom hook)
  
  // Event handlers
  
  // Render helpers (if any, consider extracting)
  
  return (
    // JSX (prefer composition over deep nesting)
  );
};

export default ComponentName;
```

---

## Styling Guidelines

### Tailwind CSS Conventions
- Use Tailwind utility classes as primary styling method
- Create custom classes in `globals.css` for repeated patterns
- Follow mobile-first responsive design (`sm:`, `md:`, `lg:`, `xl:`)

### Common Patterns
```tsx
// Card Pattern (Airbnb/Pinterest inspired)
<div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">

// Button Primary
<button className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200">

// Input Field
<input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200">

// Container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

### Color Palette
```css
/* Primary - Warm, welcoming */
--primary-50: #fef7f0;
--primary-100: #fdeee0;
--primary-500: #f59e0b;
--primary-600: #d97706;
--primary-700: #b45309;

/* Secondary - Trust, care */
--secondary-50: #f0fdf4;
--secondary-500: #22c55e;
--secondary-600: #16a34a;

/* Neutral */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-500: #6b7280;
--gray-900: #111827;
```

---

## Page Structure

### Layout Pattern
```tsx
// Standard page layout
<main className="min-h-screen bg-gray-50">
  <Navbar />
  <div className="pt-20"> {/* Account for fixed navbar */}
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page content */}
      </div>
    </section>
  </div>
  <Footer />
</main>
```

---

## User Types

The platform has 4 distinct user types:
1. **Admin** - Platform administrators with full access
2. **Support** - Customer support staff
3. **CareRecipient** - Users receiving care services
4. **CareGiver** - Users providing care services

Each user type may have different UI views and permissions.

---

## State Management

- Use React Context for global state (auth, theme, language)
- **Use React Query (@tanstack/react-query) for ALL server state and API calls**
- Use local state (useState) for component-specific UI state
- Avoid prop drilling beyond 2 levels

---

## File Naming Conventions

- **Components**: PascalCase (`UserCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.ts`, `useAdminApi.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase (`UserTypes.ts`)
- **Pages**: lowercase with hyphens (Next.js convention)

---

## API Integration with React Query

**IMPORTANT: Always use React Query for API calls. Never use raw fetch/useEffect patterns.**

### Setup
React Query is configured in `/src/providers/QueryProvider.tsx` and wrapped in the root layout.

### API Utility (`/src/lib/api.ts`)
```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Generic API call function
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions?.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || `API Error: ${response.status}`);
  }

  return data.data;
}
```

### Custom Hooks Pattern (`/src/hooks/useAdminApi.ts`)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';

// Query Keys - maintain consistent key structure
export const queryKeys = {
  analytics: ['admin', 'analytics'] as const,
  supports: (page: number, search?: string) => ['admin', 'supports', page, search] as const,
  // ... more keys
};

// Query Hook Example
export function useAnalytics() {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => adminApi.getAnalytics(token!),
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Mutation Hook Example
export function useUpdateSupport() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => adminApi.updateSupport(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'supports'] });
    },
  });
}
```

### Usage in Components
```tsx
'use client';

import { useAnalytics } from '@/hooks/useAdminApi';

export default function Dashboard() {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{data.totalUsers}</div>;
}

// For mutations
const updateMutation = useUpdateSupport();

const handleSave = async (formData) => {
  await updateMutation.mutateAsync({ id, data: formData });
};

// Access loading state
<button disabled={updateMutation.isPending}>Save</button>
```

### React Query Best Practices
1. **Always use hooks** - Never use raw fetch in components
2. **Query keys** - Use consistent, hierarchical query keys
3. **Invalidation** - Invalidate related queries on mutations
4. **Enabled flag** - Use `enabled: !!token` to prevent calls without auth
5. **Error handling** - Errors are thrown and can be caught with error boundaries
6. **Loading states** - Use `isLoading` for initial load, `isFetching` for refetch
7. **Stale time** - Set appropriate stale times to reduce unnecessary refetches
