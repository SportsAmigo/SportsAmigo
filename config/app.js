// Configure session
app.use(session({
    store: new SQLiteStore({
        db: 'database/session.db',
        dir: path.join(__dirname, '../')
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    }
})); 