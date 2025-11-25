const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');
const User = require('./models/user');
const app = express();
const port = process.env.PORT || 3000;
const alternativePorts = [3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012, 3013, 3014, 3015];

// Database setup - use the existing connection in mongodb.js instead of creating a new one
const mongoose = require('./config/mongodb');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up express-ejs-layouts
app.use(expressLayouts);
app.set('layout', false); // Don't use layout by default

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'sportsamigo-app-secret-2023',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo',
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only use secure in production
    sameSite: 'lax' // Helps with CSRF protection while allowing redirects
  }
}));

// Flash message middleware
app.use((req, res, next) => {
  // Only log session data once per session or on specific routes for debugging
  // Uncomment this section if debugging session issues
  /*
  if (req.session && req.session.user && (req.path === '/debug/session' || req.session._loggedOnce !== true)) {
    console.log(`Session user data for ${req.path}:`, {
      id: req.session.user.id,
      email: req.session.user.email,
      role: req.session.user.role,
      hasProfileImage: !!req.session.user.profile_image
    });
    // Mark this session as already logged
    req.session._loggedOnce = true;
  }
  */

  // Handle flash messages
  if (req.session.flashMessage) {
    res.locals.flashMessage = req.session.flashMessage;
    delete req.session.flashMessage;
  }
  
  // Pass user and cart data to all views
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
  } else {
    res.locals.user = null;
  }
  
  // Pass shopUser if exists
  if (req.session && req.session.shopUser) {
    res.locals.shopUser = req.session.shopUser;
  } else {
    res.locals.shopUser = null;
  }
  
  // Pass cart data to all views
  if (req.session && req.session.cart) {
    res.locals.cart = req.session.cart;
    res.locals.cartCount = req.session.cart.itemCount || 0;
  } else {
    res.locals.cart = { items: [], itemCount: 0, totalAmount: 0 };
    res.locals.cartCount = 0;
  }
  
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const organizerRoutes = require('./routes/organizer');
const playerRoutes = require('./routes/player');
const managerRoutes = require('./routes/manager');
const apiRoutes = require('./routes/api');
const shopRoutes = require('./routes/shop');
const walletRoutes = require('./routes/wallet');
const shopLoginRoutes = require('./routes/shopLogin');
const checkoutRoutes = require('./routes/checkout');
const cartRoutes = require('./routes/cart');

// Try to import admin routes with error handling
let adminRoutes;
try {
  adminRoutes = require('./routes/admin');
  console.log('Admin routes loaded successfully');
} catch (err) {
  console.error('Error loading admin routes:', err.message);
  adminRoutes = null;
}

// Debug route imports
console.log('Auth routes type:', typeof authRoutes);
console.log('Organizer routes type:', typeof organizerRoutes);
console.log('Player routes type:', typeof playerRoutes);
console.log('Manager routes type:', typeof managerRoutes);
console.log('Admin routes type:', typeof adminRoutes);

// Debugging route for checking session
app.get('/debug/session', (req, res) => {
  res.json({
    session: req.session,
    sessionID: req.sessionID,
    user: req.session.user,
    locals: res.locals
  });
});

// Debugging route for uploads directory
app.get('/debug/uploads', (req, res) => {
  const uploadDir = path.join(__dirname, 'public/uploads');
  
  if (!fs.existsSync(uploadDir)) {
    return res.json({
      exists: false,
      message: 'Uploads directory does not exist',
      path: uploadDir
    });
  }
  
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.json({
        exists: true,
        error: err.message,
        path: uploadDir
      });
    }
    
    res.json({
      exists: true,
      files: files,
      path: uploadDir
    });
  });
});

// Use routes if they are valid Express routers
if (typeof authRoutes === 'function') {
  app.use('/', authRoutes);
} else {
  console.error('Auth routes is not a function, it is:', typeof authRoutes);
}

if (typeof organizerRoutes === 'function') {
  app.use('/organizer', organizerRoutes);
} else {
  console.error('Organizer routes is not a function, it is:', typeof organizerRoutes);
}

if (typeof playerRoutes === 'function') {
  app.use('/player', playerRoutes);
} else {
  console.error('Player routes is not a function, it is:', typeof playerRoutes);
}

if (typeof managerRoutes === 'function') {
  app.use('/manager', managerRoutes);
} else {
  console.error('Manager routes is not a function, it is:', typeof managerRoutes);
}

// Shop Routes
if (typeof shopRoutes === 'function') {
  app.use('/shop', shopRoutes);
  console.log('Shop routes configured successfully');
} else {
  console.error('Shop routes is not a function, it is:', typeof shopRoutes);
}

// Wallet Routes
if (typeof walletRoutes === 'function') {
  app.use('/wallet', walletRoutes);
  console.log('Wallet routes configured successfully');
} else {
  console.error('Wallet routes is not a function, it is:', typeof walletRoutes);
}

// Shop Login Routes
if (typeof shopLoginRoutes === 'function') {
  app.use('/shop-login', shopLoginRoutes);
  console.log('Shop login routes configured successfully');
} else {
  console.error('Shop login routes is not a function, it is:', typeof shopLoginRoutes);
}

// Checkout Routes
if (typeof checkoutRoutes === 'function') {
  app.use('/checkout', checkoutRoutes);
  console.log('Checkout routes configured successfully');
} else {
  console.error('Checkout routes is not a function, it is:', typeof checkoutRoutes);
}

// Cart Routes
if (typeof cartRoutes === 'function') {
  app.use('/cart', cartRoutes);
  console.log('Cart routes configured successfully');
} else {
  console.error('Cart routes is not a function, it is:', typeof cartRoutes);
}

// API Routes for AJAX functionality
if (apiRoutes && typeof apiRoutes === 'function') {
  app.use('/api', apiRoutes);
  console.log('API routes configured successfully');
} else {
  console.error('API routes is not a function, it is:', typeof apiRoutes);
}

// Only use admin routes if properly loaded
if (adminRoutes && typeof adminRoutes === 'function') {
  app.use('/admin', adminRoutes);
  console.log('Admin routes configured successfully');
} else {
  console.warn('Warning: Admin routes not loaded, /admin endpoints will be unavailable');
}

// Home page - use EJS template
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Sports Amigo - Home',
    description: 'Join the largest sports community in India and experience the thrill of competition, the joy of teamwork, and the pride of victory.'
  });
});

// Test route to check EJS rendering
app.get('/test', (req, res) => {
  res.render('about', { 
    title: 'Test Page',
    description: 'Test page to verify EJS rendering works correctly'
  });
});

// Events page - use EJS template
app.get('/events', (req, res) => {
  res.render('player/browse-events', { 
    title: 'Events',
    headerType: 'events',
    description: 'Discover our exciting lineup of sporting events and competitions across India',
    events: [
      {
        id: 1,
        name: 'Football Championship',
        date: '2024-02-15',
        location: 'Sports Arena',
        organizer: 'Sports Club',
        status: 'upcoming',
        participants: 16
      },
      {
        id: 2,
        name: 'Basketball Tournament',
        date: '2024-02-20',
        location: 'Basketball Court',
        organizer: 'City Sports',
        status: 'upcoming',
        participants: 8
      },
      {
        id: 3,
        name: 'Cricket League',
        date: '2024-02-25',
        location: 'Cricket Ground',
        organizer: 'Local Cricket Club',
        status: 'upcoming',
        participants: 12
      }
    ]
  });
});

// Event details pages - use EJS template with sport parameter
app.get('/events/football', (req, res) => {
  res.render('player/event-details', { 
    title: 'Football Events',
    description: 'Join our exciting football championship! Compete with the best teams in the city.',
    headerType: 'football',
    event: {
      name: 'Football Championship',
      title: 'Football Championship',
      description: 'Join our exciting football championship! Compete with the best teams in the city.',
      location: 'Sports Arena',
      date: '2024-02-15',
      event_date: '2024-02-15',
      sport: 'football',
      sport_type: 'football',
      status: 'upcoming',
      max_teams: 16,
      organizer: 'Sports Club',
      registration_deadline: '2024-02-10'
    },
    teams: [],
    messages: {}
  });
});

app.get('/events/cricket', (req, res) => {
  res.render('player/event-details', { 
    title: 'Cricket Events',
    description: 'Join our exciting cricket league! Show your skills on the cricket field.',
    headerType: 'cricket',
    event: {
      name: 'Cricket League',
      title: 'Cricket League',
      description: 'Join our exciting cricket league! Show your skills on the cricket field.',
      location: 'Cricket Ground',
      date: '2024-02-25',
      event_date: '2024-02-25',
      sport: 'cricket',
      sport_type: 'cricket',
      status: 'upcoming',
      max_teams: 12,
      organizer: 'Local Cricket Club',
      registration_deadline: '2024-02-20'
    },
    teams: [],
    messages: {}
  });
});

app.get('/events/basketball', (req, res) => {
  res.render('player/event-details', { 
    title: 'Basketball Events',
    description: 'Join our exciting basketball tournament! Fast-paced action awaits.',
    headerType: 'basketball',
    event: {
      name: 'Basketball Tournament',
      title: 'Basketball Tournament',
      description: 'Join our exciting basketball tournament! Fast-paced action awaits.',
      location: 'Basketball Court',
      date: '2024-02-20',
      event_date: '2024-02-20',
      sport: 'basketball',
      sport_type: 'basketball',
      status: 'upcoming',
      max_teams: 8,
      organizer: 'City Sports',
      registration_deadline: '2024-02-15'
    },
    teams: [],
    messages: {}
  });
});

// About page - use EJS template
app.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Us',
    description: 'Learn more about the Indian Sports Association and our mission to promote sports excellence across the country.'
  });
});

// Contact page - use EJS template
app.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact Us',
    description: 'Get in touch with the Indian Sports Association. We are here to help and support your sporting journey.'
  });
});

// Support page - redirect to contact for now
app.get('/support', (req, res) => {
  res.redirect('/contact');
});

// Blog page - redirect to home for now
app.get('/blog', (req, res) => {
  res.redirect('/');
});

// Register page - redirect to signup
app.get('/register', (req, res) => {
  res.redirect('/signup');
});

// Main login and register routes
app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login', 
    error: null,
    validationErrors: {},
    email: ''
  });
});

// Route for /signup to display the signup form
app.get('/signup', (req, res) => {
  // Get role from query parameter if available
  const role = req.query.role && ['player', 'organizer', 'manager'].includes(req.query.role) 
    ? req.query.role 
    : 'player'; // Default to player
  
  res.render('signup', { 
    title: 'Sign Up', 
    role: role,
    error: null,
    validationErrors: {},
    formData: {}
  });
});

// Route for /signup/:role to display the signup form for a specific role
app.get('/signup/:role', (req, res) => {
  const role = req.params.role;
  
  // Only accept valid roles
  if (['player', 'organizer', 'manager'].includes(role)) {
    res.render('signup', { 
      title: 'Sign Up', 
      role: role,
      error: null,
      validationErrors: {},
      formData: {}
    });
  } else {
    res.redirect('/signup');
  }
});

// Handle the /signup route from the registration form
app.post('/signup', (req, res) => {
  console.log('Signup form submitted with data:', req.body);
  
  const { role, firstname, lastname, email, phone, password, confirm_password, sports, organization_name, team_name } = req.body;
  
  // Basic validation
  if (!role || !firstname || !lastname || !email || !password || !confirm_password) {
    console.log('Missing required fields:', { role, firstname, lastname, email, password: !!password, confirm_password: !!confirm_password });
    return res.status(400).render('signup', {
      title: 'Sign Up', 
      role: role || 'player',
      error: 'All required fields must be filled out',
      validationErrors: {},
      formData: req.body
    });
  }
  
  if (password !== confirm_password) {
    console.log('Password mismatch');
    return res.status(400).render('signup', {
      title: 'Sign Up', 
      role: role,
      error: 'Passwords do not match',
      validationErrors: {},
      formData: req.body
    });
  }
  
  // Role-specific validation
  if (role === 'player' && !sports) {
    console.log('Missing required fields for player role:', { sports });
    return res.status(400).render('signup', {
      title: 'Sign Up', 
      role: role,
      error: 'Please select at least one sport',
      validationErrors: {},
      formData: req.body
    });
  }
  
  if (role === 'organizer' && !organization_name) {
    console.log('Missing required fields for organizer role:', { organization_name });
    return res.status(400).render('signup', {
      title: 'Sign Up', 
      role: role,
      error: 'Organization name is required',
      validationErrors: {},
      formData: req.body
    });
  }
  
  if (role === 'manager' && !team_name) {
    console.log('Missing required fields for manager role:', { team_name });
    return res.status(400).render('signup', {
      title: 'Sign Up', 
      role: role,
      error: 'Team name is required',
      validationErrors: {},
      formData: req.body
    });
  }
  
  // Check if user already exists
  User.getUserByEmail(email)
    .then(existingUser => {
      if (existingUser) {
        return res.status(400).render('signup', {
          title: 'Sign Up', 
          role: role,
          error: 'Email is already registered',
          validationErrors: {},
          formData: req.body
        });
      }
      
      // Prepare user data with profile fields
      const userData = {
        email,
        password,
        role,
        first_name: firstname,
        last_name: lastname,
        phone: phone || null,
      };
      
      // Add role-specific data
      if (role === 'player' && sports) {
        // Handle sports properly whether it's an array or string
        if (Array.isArray(sports)) {
          userData.preferred_sports = sports.join(', ');
        } else if (typeof sports === 'string') {
          userData.preferred_sports = sports;
        } else {
          // If it's an object due to form structure, convert to array
          const sportsArray = Object.keys(sports).filter(key => sports[key] === 'on' || sports[key] === true);
          userData.preferred_sports = sportsArray.join(', ');
        }
      } else if (role === 'organizer' && organization_name) {
        userData.organization_name = organization_name;
      } else if (role === 'manager' && team_name) {
        userData.team_name = team_name;
      }
      
      // Create user with all data in one call
      return User.createUser(userData);
    })
    .then(newUser => {
      console.log('User created successfully:', newUser.email);
      
      // Set user session
      req.session.user = newUser;
      
      // Redirect to appropriate dashboard
      console.log('Redirecting to dashboard:', role);
      res.redirect(`/${role}`);
    })
    .catch(err => {
      console.error('Error during registration:', err);
      return res.status(400).render('signup', {
        title: 'Sign Up', 
        role: role,
        error: 'Error creating account: ' + err.message,
        validationErrors: {},
        formData: req.body
      });
    });
});

// Routes for specific role logins
app.get('/login/:role', (req, res) => {
  const role = req.params.role;
  // Only accept valid roles
  if (['player', 'organizer', 'manager'].includes(role)) {
    res.render('login', { 
      title: 'Login', 
      error: null,
      validationErrors: {},
      email: '',
      preselectedRole: role
    });
  } else {
    res.redirect('/login');
  }
});

// Routes for dashboard access - these would be protected in a real app
app.get('/dashboard/player', (req, res) => {
  res.render('dashboard/player');
});

app.get('/dashboard/organizer', (req, res) => {
  res.render('dashboard/organizer');
});

app.get('/dashboard/manager', (req, res) => {
  res.render('dashboard/manager');
});

// Handle form submission
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // In a real application, you would validate credentials against a database
  if (!email || !password) {
    return res.render('login', {
      error: 'Email and password are required',
      validationErrors: {},
      email: email || '',
      title: 'Login'
    });
  }
  
  // Authenticate user
  User.authenticate(email, password)
    .then(user => {
      if (!user) {
        return res.render('login', { 
          error: 'Invalid email or password',
          validationErrors: {},
          email: email || '',
          title: 'Login'
        });
      }
      
      // Set user session
      req.session.user = user;
      console.log('User logged in:', user.email);
      
      // Redirect to appropriate dashboard
      return res.redirect(`/${user.role}`);
    })
    .catch(err => {
      console.error('Error during login:', err);
      return res.render('login', { 
        error: 'An error occurred. Please try again.',
        validationErrors: {},
        email: email || '',
        title: 'Login'
      });
    });
});

// Handle role-specific form submission
app.post('/login/:role', (req, res) => {
  const { email, password } = req.body;
  const role = req.params.role;
  
  // In a real application, you would validate credentials against a database
  if (!email || !password) {
    return res.render('login', {
      error: 'Email and password are required',
      validationErrors: {},
      email: email || '',
      title: 'Login',
      preselectedRole: role
    });
  }
  
  // Authenticate user
  User.authenticate(email, password)
    .then(user => {
      if (!user) {
        return res.render('login', { 
          error: 'Invalid email or password',
          validationErrors: {},
          email: email || '',
          title: 'Login',
          preselectedRole: role
        });
      }
      
      // Check if the role matches
      if (user.role !== role) {
        return res.render('login', { 
          error: `This account is not registered as a ${role}. Please use the correct login page.`,
          validationErrors: {},
          email: email || '',
          title: 'Login',
          preselectedRole: role
        });
      }
      
      // Set user session
      req.session.user = user;
      console.log('User logged in:', user.email);
      
      // Redirect to appropriate dashboard
      return res.redirect(`/${user.role}`);
    })
    .catch(err => {
      console.error('Error during login:', err);
      return res.render('login', { 
        error: 'An error occurred. Please try again.',
        validationErrors: {},
        email: email || '',
        title: 'Login',
        preselectedRole: role
      });
    });
});

// Direct admin login (temporary route for troubleshooting)
app.get('/direct-admin-login', async (req, res) => {
  try {
    // Get admin by email
    const admin = await User.getUserByEmail('admin@sportsapp.com');
    
    if (!admin || admin.role !== 'admin') {
      return res.send('Admin account not found');
    }
    
    // Set up session
    req.session.user = {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      first_name: admin.first_name,
      last_name: admin.last_name
    };
    
    console.log('Direct admin login successful for:', admin.email);
    
    // Redirect to dashboard
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Direct admin login error:', err);
    res.status(500).send('Direct admin login error: ' + err.message);
  }
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render('error', { 
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.',
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Send more detailed error for debugging
  res.status(500).send(`
    <h1>500 - Server Error</h1>
    <p>Something went wrong on our server.</p>
    <h3>Error Details (Debug Only):</h3>
    <pre>${err.stack}</pre>
  `);
});

// Start the server with fallback ports
function startServer(portToUse) {
  const server = app.listen(portToUse)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${portToUse} is already in use. Trying another port...`);
        if (alternativePorts.length > 0) {
          const nextPort = alternativePorts.shift();
          startServer(nextPort);
        } else {
          console.error('All ports are in use. Please close some applications and try again.');
          process.exit(1);
        }
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    })
    .on('listening', () => {
      console.log(`Server running on http://localhost:${portToUse}`);
    });
}

startServer(port); 