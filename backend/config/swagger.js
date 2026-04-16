const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SportsAmigo API',
      version: '1.0.0',
      description: 'Complete API documentation for the SportsAmigo sports management platform',
      contact: { name: 'SportsAmigo Team' }
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://sportsamigo.onrender.com', description: 'Production (Render)' }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session-based authentication via Express session cookies'
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF token for state-changing operations'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            first_name: { type: 'string', description: 'First name' },
            last_name: { type: 'string', description: 'Last name' },
            role: {
              type: 'string',
              enum: ['player', 'manager', 'organizer', 'moderator', 'admin'],
              description: 'User role in the system'
            },
            phone: { type: 'string', description: 'Phone number' },
            profile_image: { type: 'string', description: 'Profile image URL' },
            created_at: { type: 'string', format: 'date-time', description: 'Account creation date' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Event ID' },
            title: { type: 'string', description: 'Event title' },
            description: { type: 'string', description: 'Event description' },
            event_date: { type: 'string', format: 'date-time', description: 'Event date and time' },
            location: { type: 'string', description: 'Event location/venue' },
            sport_type: { type: 'string', description: 'Type of sport' },
            status: {
              type: 'string',
              enum: ['upcoming', 'ongoing', 'completed', 'pending_approval', 'rejected', 'draft', 'cancelled'],
              description: 'Event status'
            },
            max_teams: { type: 'integer', description: 'Maximum number of teams allowed' },
            entry_fee: { type: 'number', description: 'Entry fee amount in INR' },
            organizer_id: { type: 'string', description: 'ID of the organizer' },
            created_at: { type: 'string', format: 'date-time', description: 'Event creation date' }
          }
        },
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Team ID' },
            name: { type: 'string', description: 'Team name' },
            sport_type: { type: 'string', description: 'Sport type' },
            description: { type: 'string', description: 'Team description' },
            max_members: { type: 'integer', description: 'Maximum team size' },
            manager_id: { type: 'string', description: 'Team manager ID' },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  player_id: { type: 'string' },
                  role: { type: 'string' },
                  joined_date: { type: 'string', format: 'date-time' }
                }
              },
              description: 'Team members list'
            },
            created_at: { type: 'string', format: 'date-time', description: 'Team creation date' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Subscription ID' },
            user_id: { type: 'string', description: 'Subscriber user ID' },
            plan: {
              type: 'string',
              enum: ['free', 'pro', 'enterprise'],
              description: 'Subscription plan'
            },
            billingCycle: {
              type: 'string',
              enum: ['monthly', 'yearly'],
              description: 'Billing cycle'
            },
            status: {
              type: 'string',
              enum: ['active', 'cancelled', 'expired', 'past_due'],
              description: 'Subscription status'
            },
            startDate: { type: 'string', format: 'date-time', description: 'Subscription start date' },
            endDate: { type: 'string', format: 'date-time', description: 'Subscription end date' },
            price: { type: 'number', description: 'Subscription price in INR' },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of features included'
            }
          }
        },
        VASProduct: {
          type: 'object',
          properties: {
            serviceType: {
              type: 'string',
              enum: ['event_insurance', 'marketing_boost', 'certificates', 'sms_package', 'premium_profile', 'performance_analytics', 'player_insurance'],
              description: 'Type of value-added service'
            },
            name: { type: 'string', description: 'Service name' },
            description: { type: 'string', description: 'Service description' },
            tier: { type: 'string', description: 'Service tier (basic, comprehensive, etc.)' },
            price: { type: 'number', description: 'Service price in INR' },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of features included'
            }
          }
        },
        Commission: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Commission record ID' },
            event: { $ref: '#/components/schemas/Event' },
            organizer: { type: 'string', description: 'Organizer ID' },
            totalRevenue: { type: 'number', description: 'Total revenue from event' },
            commissionAmount: { type: 'number', description: 'Platform commission amount' },
            organizerPayout: { type: 'number', description: 'Amount paid to organizer' },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'paid', 'failed'],
              description: 'Payout status'
            },
            eligibleForPayoutAt: { type: 'string', format: 'date-time', description: 'Date when payout becomes eligible' },
            createdAt: { type: 'string', format: 'date-time', description: 'Commission record creation date' }
          }
        },
        Match: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Match ID' },
            event_id: { type: 'string', description: 'Event ID' },
            team1_id: { type: 'string', description: 'First team ID' },
            team2_id: { type: 'string', description: 'Second team ID' },
            match_date: { type: 'string', format: 'date-time', description: 'Match date and time' },
            venue: { type: 'string', description: 'Match venue' },
            status: {
              type: 'string',
              enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
              description: 'Match status'
            },
            result: {
              type: 'object',
              properties: {
                winner: { type: 'string', description: 'Winner team ID' },
                team1_score: { type: 'number', description: 'Team 1 score' },
                team2_score: { type: 'number', description: 'Team 2 score' }
              }
            }
          }
        },
        ShopItem: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Product ID' },
            name: { type: 'string', description: 'Product name' },
            description: { type: 'string', description: 'Product description' },
            price: { type: 'number', description: 'Product price in INR' },
            category: { type: 'string', description: 'Product category' },
            image_url: { type: 'string', description: 'Product image URL' },
            stock: { type: 'integer', description: 'Available stock quantity' },
            featured: { type: 'boolean', description: 'Whether product is featured' }
          }
        },
        WalletTransaction: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Transaction ID' },
            user_id: { type: 'string', description: 'User ID' },
            type: {
              type: 'string',
              enum: ['credit', 'debit'],
              description: 'Transaction type'
            },
            amount: { type: 'number', description: 'Transaction amount in INR' },
            balance: { type: 'number', description: 'Balance after transaction' },
            description: { type: 'string', description: 'Transaction description' },
            reference_id: { type: 'string', description: 'Reference ID (order ID, etc.)' },
            created_at: { type: 'string', format: 'date-time', description: 'Transaction timestamp' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true, description: 'Operation success status' },
            message: { type: 'string', description: 'Success message' },
            data: { type: 'object', description: 'Response data' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false, description: 'Operation success status' },
            message: { type: 'string', description: 'Error message' },
            error: { type: 'string', description: 'Error code or details' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation error' },
            errors: {
              type: 'object',
              additionalProperties: { type: 'string' },
              description: 'Field-specific validation errors'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', description: 'Current page number' },
            limit: { type: 'integer', description: 'Items per page' },
            total: { type: 'integer', description: 'Total number of items' },
            totalPages: { type: 'integer', description: 'Total number of pages' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Login, signup, OTP verification, password reset' },
      { name: 'Player', description: 'Player dashboard, teams, events, profile, stats' },
      { name: 'Organizer', description: 'Event management, revenue tracking, organizer profile' },
      { name: 'Manager', description: 'Team CRUD, member management, join requests, match results' },
      { name: 'Admin', description: 'Platform administration and management' },
      { name: 'Matches', description: 'Match scheduling, results, and approval workflows' },
      { name: 'Shop', description: 'Product browsing, search, and categories' },
      { name: 'Cart', description: 'Session-based shopping cart management' },
      { name: 'Checkout', description: 'Order processing and payment' },
      { name: 'Wallet', description: 'Player wallet - balance, top-up, transactions' },
      { name: 'Subscriptions', description: 'Organizer subscription plans (legacy)' },
      { name: 'Subscriptions v1', description: 'v1 RESTful subscription API with receipts' },
      { name: 'VAS', description: 'Value-Added Services (legacy)' },
      { name: 'VAS v1', description: 'v1 RESTful VAS API with receipts' },
      { name: 'Commission', description: 'Commission tracking and payout management' },
      { name: 'Moderator', description: 'Organizer verification and event approval workflows' },
      { name: 'Tier', description: 'Organizer tier progression system' },
      { name: 'General', description: 'General platform APIs' },
      { name: 'B2B — Subscriptions', description: 'B2B flow: organizer subscription management (create, verify, cancel)' },
      { name: 'B2B — VAS', description: 'B2B flow: value-added services for organizers' },
      { name: 'B2C — Shop', description: 'B2C flow: player-facing sports shop' },
      { name: 'B2C — Wallet', description: 'B2C flow: player wallet operations' },
      { name: 'B2C — Events', description: 'B2C flow: player event discovery, registration, and payments' }
    ]
  },
  apis: ['./routes/*.js', './routes/v1/*.js']
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
