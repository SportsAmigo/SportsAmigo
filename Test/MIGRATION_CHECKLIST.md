# SportsAmigo Frontend Migration Checklist

## Quick Reference Guide for React Migration (Public Pages Only)

**Note**: Shop functionality has been moved to Player Dashboard and is OUT OF SCOPE for this migration.

---

## 📦 Project Setup

### Initial Setup
- [ ] Create React app structure in `frontend/` directory
- [ ] Install dependencies:
  - [ ] react-router-dom (routing)
  - [ ] axios (API calls)
  - [ ] react-hook-form (form handling)
  - [ ] yup or zod (validation)
  - [ ] Context API (built-in state management)
  - [ ] Optional: Tailwind CSS / Material-UI / Styled Components
- [ ] Set up folder structure as per analysis
- [ ] Configure environment variables (.env)
- [ ] Set up proxy for API calls (if needed)

### Build Configuration
- [ ] Update Vite config for asset handling
- [ ] Configure path aliases (@components, @pages, etc.)
- [ ] Set up ESLint and Prettier
- [ ] Configure build scripts in package.json

---

## 🎨 Assets Migration

### Static Assets
- [ ] Copy images from `Old_Ver/public/images/` to `frontend/public/images/`
  - [ ] sports-amigo-logo.png
  - [ ] logooo-removebg-preview.png
  - [ ] Shop product images
  - [ ] Background images
  - [ ] Icons
- [ ] Copy CSS from `Old_Ver/public/css/` to `frontend/public/css/` or convert to CSS modules
  - [ ] style.css (main styles)
  - [ ] Shop styles
  - [ ] Dashboard styles
- [ ] Copy JavaScript files if needed from `Old_Ver/public/js/`
- [ ] Migrate Font Awesome or install as npm package

---

## 🔧 Core Infrastructure (Phase 1)

### Routing
- [ ] Create `routes/AppRoutes.jsx`
- [ ] Set up React Router DOM with BrowserRouter
- [ ] Define all route paths
- [ ] Create 404/Not Found page

### Context & State Management
- [ ] Create `contexts/AuthContext.jsx`
  - [ ] Implement login method
  - [ ] Implement signup method
  - [ ] Implement logout method
  - [ ] Implement getCurrentUser method
  - [ ] Add loading and error states
  - [ ] Add token refresh logic

### Custom Hooks
- [ ] Create `hooks/useAuth.js`
- [ ] Create `hooks/useFetch.js`
- [ ] Create `hooks/useForm.js`
- [ ] Create `hooks/usePagination.js` (optional for future use)

### API Services
- [ ] Create `services/api.js` (Axios instance)
  - [ ] Set base URL
  - [ ] Add request interceptor (for auth token)
  - [ ] Add response interceptor (for error handling)
- [ ] Create `services/auth.service.js`
  - [ ] login(email, password, role)
  - [ ] signup(userData, role)
  - [ ] logout()
  - [ ] getCurrentUser()
  - [ ] checkEmailAvailability(email)
  - [ ] refreshToken()
- [ ] Create `services/contact.service.js`
  - [ ] submitContactForm(formData)

### Layout Components
- [ ] Create `components/layout/Navbar.jsx`
  - [ ] Logo
  - [ ] Navigation links
  - [ ] Events dropdown
  - [ ] User menu dropdown
  - [ ] Mobile hamburger menu
  - [ ] Responsive styling
- [ ] Create `components/layout/Footer.jsx`
  - [ ] Company info
  - [ ] Quick links
  - [ ] Contact information
  - [ ] Copyright notice
- [ ] Create `components/layout/AppLayout.jsx`
  - [ ] Integrate Navbar
  - [ ] Main content area
  - [ ] Integrate Footer
- [ ] Create `components/layout/DashboardLayout.jsx` (skeleton for future use)
  - [ ] Basic structure only (not implementing dashboard pages now)

### Auth Components
- [ ] Create `components/auth/ProtectedRoute.jsx`
- [ ] Create `components/auth/RoleBasedRoute.jsx`
- [ ] Create `components/auth/AuthGuard.jsx`

---

## 🧩 UI Components Library (Foundation)

### Basic UI Components
- [ ] Create `components/ui/Button.jsx`
  - [ ] Variants: primary, secondary, success, danger, warning, info, outline
  - [ ] Sizes: sm, md, lg
  - [ ] States: normal, loading, disabled
- [ ] Create `components/ui/Card.jsx`
  - [ ] Header, body, footer sections
  - [ ] Variants: basic, elevated, bordered
- [ ] Create `components/ui/Input.jsx`
  - [ ] Text, email, password, number, tel types
  - [ ] Error state styling
  - [ ] Label integration
- [ ] Create `components/ui/FormGroup.jsx`
  - [ ] Label
  - [ ] Input wrapper
  - [ ] Error message display
  - [ ] Help text
- [ ] Create `components/ui/Badge.jsx`
  - [ ] Variants: primary, success, warning, danger, info
  - [ ] Sizes: sm, md, lg
- [ ] Create `components/ui/Modal.jsx`
  - [ ] Backdrop
  - [ ] Close button
  - [ ] Header, body, footer sections
  - [ ] Animation
- [ ] Create `components/ui/Alert.jsx`
  - [ ] Types: success, error, warning, info
  - [ ] Dismissible option
  - [ ] Icon support
- [ ] Create `components/ui/LoadingSpinner.jsx`
  - [ ] Sizes: sm, md, lg
  - [ ] Color variants
  - [ ] Full-page overlay option
- [ ] Create `components/ui/Dropdown.jsx`
  - [ ] Trigger component
  - [ ] Menu items
  - [ ] Close on select
  - [ ] Positioning
- [ ] Create `components/ui/Table.jsx`
  - [ ] Column definitions
  - [ ] Sortable headers
  - [ ] Row actions
  - [ ] Pagination support

---

## 📝 Form Components

### Authentication Forms
- [ ] Create `components/forms/LoginForm.jsx`
  - [ ] Role selector (Organizer, Manager, Player)
  - [ ] Email input with validation
  - [ ] Password input
  - [ ] Remember me checkbox
  - [ ] Forgot password link
  - [ ] Form validation
  - [ ] Error handling
  - [ ] Submit handler
- [ ] Create `components/forms/SignupForm.jsx`
  - [ ] Role selector
  - [ ] First name input
  - [ ] Last name input
  - [ ] Email input with availability check
  - [ ] Phone input with validation
  - [ ] Password input with strength indicator
  - [ ] Confirm password input
  - [ ] Terms & conditions checkbox
  - [ ] Form validation
  - [ ] Error handling
  - [ ] Submit handler

### Other Forms
- [ ] Create `components/forms/ContactForm.jsx`
  - [ ] Name input
  - [ ] Email input
  - [ ] Subject input
  - [ ] Message textarea
  - [ ] Form validation
  - [ ] Submit handler

---

## 🌐 Common Components

### Navigation & Utility
- [ ] Create `components/common/RoleCard.jsx`
  - [ ] Role icon
  - [ ] Role title
  - [ ] Role description
  - [ ] Action button
  - [ ] Hover effects
- [ ] Create `components/common/HeroSection.jsx`
  - [ ] Background image
  - [ ] Title
  - [ ] Subtitle
  - [ ] CTA button
  - [ ] Overlay
- [ ] Create `components/common/InfoSection.jsx`
  - [ ] Section title
  - [ ] Section image
  - [ ] Section content
  - [ ] Layout variants (left/right image)
- [ ] Create `components/common/EventsDropdown.jsx`
  - [ ] Football link
  - [ ] Cricket link
  - [ ] Basketball link
  - [ ] Dropdown styling
- [ ] Create `components/common/UserMenu.jsx`
  - [ ] User avatar
  - [ ] User name
  - [ ] Profile link
  - [ ] Orders link
  - [ ] Wallet link (player only)
  - [ ] Dashboard link
  - [ ] Logout button

### Navigation Components
- [ ] Create `components/navigation/MainNav.jsx`
- [ ] Create `components/navigation/MobileMenu.jsx`
- [ ] Create `components/navigation/Breadcrumbs.jsx` (optional for future use)

---

## 📄 Page Components (Phase 2)

### Public Pages
- [ ] Create `pages/Home.jsx`
  - [ ] Use AppLayout
  - [ ] Hero section with brand message
  - [ ] Role selection cards (3x RoleCard)
  - [ ] Links to appropriate login/signup
  - [ ] SEO meta tags
- [ ] Create `pages/About.jsx`
  - [ ] Use AppLayout
  - [ ] Page header
  - [ ] Mission section (InfoSection)
  - [ ] Vision section (InfoSection)
  - [ ] Values section (InfoSection)
  - [ ] Team section (optional)
  - [ ] SEO meta tags
- [ ] Create `pages/Contact.jsx`
  - [ ] Use AppLayout
  - [ ] Page header
  - [ ] Google Maps embed
  - [ ] Contact information display
  - [ ] ContactForm
  - [ ] SEO meta tags

### Authentication Pages
- [ ] Create `pages/Auth/Login.jsx`
  - [ ] Use minimal AppLayout (or no layout)
  - [ ] Page header/title
  - [ ] LoginForm
  - [ ] Link to signup page
  - [ ] Link to password recovery (if implemented)
  - [ ] Handle form submission
  - [ ] Navigate on success
  - [ ] Display errors
- [ ] Create `pages/Auth/Signup.jsx`
  - [ ] Use minimal AppLayout (or no layout)
  - [ ] Page header/title
  - [ ] SignupForm
  - [ ] Link to login page
  - [ ] Handle form submission
  - [ ] Navigate on success
  - [ ] Display errors
- [ ] Create `pages/Auth/AdminLogin.jsx`
  - [ ] Minimal/no layout
  - [ ] Admin badge/indicator
  - [ ] LoginForm (admin variant)
  - [ ] Enhanced security messaging
  - [ ] Handle form submission
  - [ ] Navigate to admin dashboard on success

---

## 🎨 Styling & Responsiveness

### Global Styles
- [ ] Create/migrate global CSS
- [ ] Define CSS variables/tokens
  - [ ] Colors (primary, secondary, etc.)
  - [ ] Typography (fonts, sizes)
  - [ ] Spacing scale
  - [ ] Border radius
  - [ ] Shadows
  - [ ] Breakpoints
- [ ] Create utility classes (if not using Tailwind)
- [ ] Set up responsive breakpoints

### Component Styling
- [ ] Style all layout components
- [ ] Style all UI components
- [ ] Style all form components
- [ ] Style all common components
- [ ] Style all page components
- [ ] Ensure mobile responsiveness for all components
- [ ] Add hover/focus states
- [ ] Add animations/transitions (subtle)

### Theme Support (Optional)
- [ ] Set up theme provider
- [ ] Define light theme
- [ ] Define dark theme (optional)
- [ ] Add theme toggle

---

## 🧪 Testing & Quality

### Component Testing
- [ ] Write unit tests for UI components
- [ ] Write unit tests for form components
- [ ] Write unit tests for common components
- [ ] Write integration tests for pages

### Functionality Testing
- [ ] Test authentication flow
  - [ ] Login for each role
  - [ ] Signup for each role
  - [ ] Logout
  - [ ] Session persistence
  - [ ] Protected routes
- [ ] Test navigation
  - [ ] All public links
  - [ ] User menu links
  - [ ] Mobile menu
- [ ] Test form validations
  - [ ] All form fields
  - [ ] Error messages
  - [ ] Submission
- [ ] Test contact form
  - [ ] Successful submission
  - [ ] Error handling

### Cross-Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

### Responsive Testing
- [ ] Test on mobile (320px - 480px)
- [ ] Test on tablet (481px - 768px)
- [ ] Test on desktop (769px+)
- [ ] Test on large desktop (1200px+)

### Performance Testing
- [ ] Lighthouse audit
- [ ] Page load time optimization
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading for routes

---

## 🚀 Deployment Preparation

### Pre-Deployment
- [ ] Environment variable configuration
- [ ] Build optimization
- [ ] Asset compression
- [ ] Remove console.logs
- [ ] Update API endpoints for production
- [ ] Test production build locally
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Set up analytics (e.g., Google Analytics)

### SEO & Meta
- [ ] Add meta tags to all pages
- [ ] Set up proper title tags
- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags
- [ ] Create sitemap.xml
- [ ] Create robots.txt
- [ ] Add structured data (JSON-LD)

### Documentation
- [ ] Document component props
- [ ] Document API service methods
- [ ] Document hooks usage
- [ ] Create README for frontend
- [ ] Document environment variables
- [ ] Document build process
- [ ] Document deployment process

---

## 📊 Migration Progress Tracking

### Phase 1: Infrastructure (Week 1)
- Total Tasks: ~25
- Completed: [ ] 0/25
- In Progress: [ ]
- Status: Not Started / In Progress / Completed

### Phase 2: Public Pages (Week 2)
- Total Tasks: ~20
- Completed: [ ] 0/20
- In Progress: [ ]
- Status: Not Started / In Progress / Completed

### Phase 3: Polish & Testing (Week 3)
- Total Tasks: ~20
- Completed: [ ] 0/20
- In Progress: [ ]
- Status: Not Started / In Progress / Completed

---

## 🐛 Known Issues / Technical Debt

### Items to Address
- [ ] List any issues discovered during migration
- [ ] List any temporary workarounds
- [ ] List any features to revisit
- [ ] List any performance bottlenecks

---

## 📝 Notes & Decisions

### Technical Decisions
- **State Management**: Context API (AuthContext only for now)
- **Styling Approach**: [Choose: Tailwind / Material-UI / Styled Components / CSS Modules]
- **Form Handling**: React Hook Form + Yup/Zod for validation
- **API Calls**: Axios with interceptors
- **Authentication**: JWT tokens stored in httpOnly cookies or localStorage
- **Scope**: Public pages only - Shop moved to Player Dashboard

### Migration Strategy
- Start with core infrastructure and work outward
- Build component library first for consistency
- Test each phase before moving to next
- Keep Old_Ver running until migration complete
- Gradual rollout to users (if possible)

---

## ✅ Final Checklist Before Launch

- [ ] All pages migrated and functional
- [ ] All features tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility verified
- [ ] Performance optimization complete
- [ ] SEO setup complete
- [ ] Error tracking configured
- [ ] Analytics configured
- [ ] Documentation complete
- [ ] Production environment configured
- [ ] Backup plan in place
- [ ] Rollback plan in place
- [ ] Team training complete (if applicable)
- [ ] User acceptance testing complete
- [ ] Security audit complete
- [ ] Load testing complete (if high traffic expected)

---

**Last Updated**: November 9, 2025
**Estimated Completion**: 3 weeks (based on 1-2 developers)
**Scope**: Public pages and authentication only (Shop excluded - moved to Player Dashboard)
