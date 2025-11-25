# SportsAmigo React Component Tree

## Visual Component Hierarchy

```
src/
├── App.jsx (Root Component)
│   ├── AuthContext.Provider
│   └── Router
│
├── components/
│   │
│   ├── layout/
│   │   ├── AppLayout.jsx ─────────────── (Public pages wrapper)
│   │   │   ├── Navbar.jsx
│   │   │   │   ├── Logo
│   │   │   │   ├── NavLinks
│   │   │   │   │   ├── EventsDropdown.jsx
│   │   │   │   │   └── UserMenu.jsx (if authenticated)
│   │   │   │   └── MobileMenu.jsx
│   │   │   ├── {children} ───────────── (Page content)
│   │   │   └── Footer.jsx
│   │   │
│   │   ├── DashboardLayout.jsx ───────── (Dashboard wrapper)
│   │   │   ├── DashboardNav.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   │   └── SidebarItem[]
│   │   │   └── {children} ───────────── (Dashboard content)
│   │   │
│   ├── ui/ (Reusable UI primitives)
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── Input.jsx
│   │   ├── FormGroup.jsx
│   │   ├── Badge.jsx
│   │   ├── Dropdown.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── Alert.jsx
│   │
│   ├── forms/
│   │   ├── LoginForm.jsx ─────────────── Uses: Input, Button, FormGroup, Alert
│   │   │   ├── RoleSelector
│   │   │   ├── EmailInput
│   │   │   ├── PasswordInput
│   │   │   └── RememberMe
│   │   │
│   │   ├── SignupForm.jsx ────────────── Uses: Input, Button, FormGroup, Alert
│   │   │   ├── RoleSelector
│   │   │   ├── NameInputs (First & Last)
│   │   │   ├── EmailInput (with availability check)
│   │   │   ├── PhoneInput (with validation)
│   │   │   ├── PasswordInputs (Password & Confirm)
│   │   │   └── TermsCheckbox
│   │   │
│   │   ├── ContactForm.jsx ───────────── Uses: Input, Button, FormGroup, Alert
│   │   │   ├── NameInput
│   │   │   ├── EmailInput
│   │   │   ├── SubjectInput
│   │   │   └── MessageTextarea
│   │   │
│   ├── common/
│   │   ├── RoleCard.jsx ──────────────── Uses: Card, Button
│   │   │   ├── RoleIcon
│   │   │   ├── RoleTitle
│   │   │   ├── RoleDescription
│   │   │   └── ActionButton
│   │   │
│   │   ├── HeroSection.jsx ───────────── Uses: Button
│   │   │   ├── HeroImage (background)
│   │   │   ├── HeroTitle
│   │   │   ├── HeroSubtitle
│   │   │   └── CTAButton
│   │   │
│   │   ├── InfoSection.jsx ───────────── Uses: Card
│   │   │   ├── SectionTitle
│   │   │   ├── SectionImage
│   │   │   └── SectionContent
│   │   │
│   │   ├── EventsDropdown.jsx ────────── Uses: Dropdown
│   │   │   └── EventLink[] (Football, Cricket, Basketball)
│   │   │
│   │   └── UserMenu.jsx ──────────────── Uses: Dropdown, Badge
│   │       ├── UserAvatar
│   │       ├── UserName
│   │       └── MenuItems[]
│   │           ├── ProfileLink
│   │           ├── OrdersLink
│   │           ├── WalletLink (player only)
│   │           ├── DashboardLink
│   │           └── LogoutButton
│   │
│   ├── navigation/
│   │   ├── MainNav.jsx ───────────────── Main navigation component
│   │   ├── MobileMenu.jsx ────────────── Mobile drawer menu
│   │   └── Breadcrumbs.jsx ───────────── Breadcrumb navigation
│   │
│   └── auth/
│       ├── ProtectedRoute.jsx ────────── Route guard for authenticated pages
│       ├── RoleBasedRoute.jsx ────────── Route guard for role-specific pages
│       └── AuthGuard.jsx ─────────────── General authentication guard
│
├── pages/
│   ├── Home.jsx
│   │   Uses: AppLayout, HeroSection, RoleCard
│   │   └── Components:
│   │       ├── Hero ("SportsAmigo - Join the community")
│   │       └── RoleSelection
│   │           ├── RoleCard (Organizer)
│   │           ├── RoleCard (Player)
│   │           └── RoleCard (Manager)
│   │
│   ├── About.jsx
│   │   Uses: AppLayout, InfoSection
│   │   └── Components:
│   │       ├── PageHeader
│   │       ├── MissionSection (InfoSection)
│   │       ├── VisionSection (InfoSection)
│   │       ├── ValuesSection (InfoSection)
│   │       └── TeamSection (optional)
│   │
│   ├── Contact.jsx
│   │   Uses: AppLayout, ContactForm
│   │   └── Components:
│   │       ├── PageHeader
│   │       ├── GoogleMap (iframe)
│   │       ├── ContactInfo
│   │       │   ├── AddressInfo
│   │       │   ├── PhoneInfo
│   │       │   └── EmailInfo
│   │       └── ContactForm
│   │
│   ├── Auth/
│   │   ├── Login.jsx
│   │   │   Uses: AppLayout (minimal), LoginForm, Alert
│   │   │   └── Components:
│   │   │       ├── PageHeader
│   │   │       ├── LoginForm
│   │   │       └── SignupLink
│   │   │
│   │   ├── Signup.jsx
│   │   │   Uses: AppLayout (minimal), SignupForm, Alert
│   │   │   └── Components:
│   │   │       ├── PageHeader
│   │   │       ├── SignupForm
│   │   │       └── LoginLink
│   │   │
│   │   └── AdminLogin.jsx
│   │       Uses: Minimal layout, LoginForm (admin variant)
│   │       └── Components:
│   │           ├── AdminBadge
│   │           └── AdminLoginForm
│   │
├── contexts/
│   └── AuthContext.jsx
│       Provides: { user, isAuthenticated, login, logout, loading, signup }
│
├── hooks/
│   ├── useAuth.js ────────────────────── Returns: user, isAuthenticated, login(), logout()
│   ├── useFetch.js ───────────────────── Returns: data, loading, error, refetch()
│   ├── usePagination.js ──────────────── Returns: page, setPage, hasNext, hasPrev
│   └── useForm.js ────────────────────── Returns: values, errors, handleChange, handleSubmit
│
├── services/
│   ├── api.js ────────────────────────── Axios instance configuration
│   ├── auth.service.js ───────────────── Auth API calls
│   └── contact.service.js ────────────── Contact form submission
│
└── routes/
    └── AppRoutes.jsx
        ├── Public Routes
        │   ├── / ──────────────────────→ Home
        │   ├── /about ─────────────────→ About
        │   ├── /contact ───────────────→ Contact
        │   ├── /login ─────────────────→ Auth/Login
        │   ├── /signup ────────────────→ Auth/Signup
        │   └── /admin-login ───────────→ Auth/AdminLogin
        │
        └── Protected Routes (Dashboard areas - future scope)
            ├── /player/* ──────────────→ Player Dashboard (includes shop)
            ├── /manager/* ─────────────→ Manager Dashboard
            ├── /organizer/* ───────────→ Organizer Dashboard
            └── /admin/* ───────────────→ Admin Dashboard
```

---

## Component Dependencies Map

### High-Level Dependencies
```
Page Components
    ↓ uses
Layout Components (AppLayout, ShopLayout, etc.)
    ↓ uses
Feature Components (LoginForm, ProductGrid, etc.)
    ↓ uses
UI Components (Button, Card, Input, etc.)
```

### Cross-Component Communication
```
AuthContext ──→ All pages (user state)
    ↓
Services ─────→ All data-fetching components
```

---

## Component Reusability Matrix

| Component | Used By | Frequency |
|-----------|---------|-----------|
| Button | Almost all components | Very High |
| Card | RoleCard, InfoSection | Medium |
| Input | All forms | Very High |
| FormGroup | All forms | Very High |
| Modal | Various pages for dialogs | Medium |
| Badge | Status indicators | Medium |
| LoadingSpinner | All data-fetching components | High |
| Alert | All pages for notifications | High |
| Dropdown | Navbar | Low |
| Navbar | AppLayout | High |
| Footer | All layouts | High |

---

## State Flow Diagram

```
User Actions ──→ Component Events ──→ Context Actions ──→ Service Calls ──→ Backend API
                       ↓                       ↓                ↓
                  Local State            Global State      Response Data
                       ↓                       ↓                ↓
                 Re-render              Broadcast Update    Update State
```

### Example: Contact Form Submission Flow
```
User fills out contact form
    ↓
ContactForm.onSubmit() fires
    ↓
contact.service.submitContactForm(formData) API call
    ↓
Backend processes and sends email
    ↓
Response received → Show success/error message
    ↓
Alert component displays feedback
    ↓
Form resets (on success)
```

---

## Routing Structure

```
<BrowserRouter>
  <AuthContext.Provider>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      
      {/* Role-based Protected Routes (Future) */}
      <Route element={<RoleBasedRoute allowedRoles={['player']} />}>
        {/* Player dashboard routes (including shop) */}
      </Route>
      
      {/* ... other role routes */}
    </Routes>
  </AuthContext.Provider>
</BrowserRouter>
```

---

**Document Created**: November 9, 2025
