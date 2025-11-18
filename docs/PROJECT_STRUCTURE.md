# 🏗️ AidFlow AI - Project Structure

## 📁 Complete Project Organization

```
AidFlow/
│
├── 📂 backend/                          # Backend Server (Node.js + Express)
│   ├── 📂 config/                       # Configuration files
│   │   └── db.js                        # Database connection
│   │
│   ├── 📂 models/                       # MongoDB Models (Mongoose Schemas)
│   │   ├── User.js                      # User authentication model
│   │   ├── Emergency.js                 # Emergency request model
│   │   ├── Inventory.js                 # Inventory items, locations, transactions
│   │   ├── DisasterZone.js              # Disaster zone tracking
│   │   ├── RoutingHistory.js            # Route calculation history
│   │   ├── SeverityLog.js               # AI severity analysis logs
│   │   └── AgentOutput.js               # AI agent outputs
│   │
│   ├── 📂 routes/                       # API Routes
│   │   ├── auth.js                      # Authentication routes
│   │   ├── emergency.js                 # Emergency management routes
│   │   ├── inventory.js                 # Inventory CRUD routes
│   │   ├── agents.js                    # AI agents routes
│   │   └── users.js                     # User management routes
│   │
│   ├── 📂 services/                     # Business Logic Services
│   │   ├── aiAgent.js                   # Main AI emergency agent
│   │   ├── nlpEngine.js                 # NLP sentiment analysis (Agent 1)
│   │   ├── imageDisasterDetection.js    # Image analysis (Agent 2)
│   │   ├── smartRouting.js              # Smart routing (Agent 3)
│   │   ├── routingService.js            # OSRM routing integration
│   │   └── dispatchService.js           # Automated dispatch system
│   │
│   ├── 📂 utils/                        # Utility Functions
│   │   └── helpers.js                   # Helper functions
│   │
│   ├── 📂 data/                         # Data Files
│   │   ├── inventory.json               # Mock inventory data
│   │   └── disasters.json               # Mock disaster data
│   │
│   ├── 📂 library/                      # External Libraries
│   │   └── natural/                     # NLP library
│   │
│   ├── .env                             # Environment variables
│   ├── server.js                        # Main server entry point
│   ├── package.json                     # Backend dependencies
│   └── README.md                        # Backend documentation
│
├── 📂 frontend/                         # Frontend Application (React)
│   ├── 📂 public/                       # Static Assets
│   │   ├── imgs/                        # Images
│   │   ├── index.html                   # HTML template
│   │   └── favicon.ico                  # Favicon
│   │
│   ├── 📂 src/                          # Source Code
│   │   │
│   │   ├── 📂 components/               # React Components
│   │   │   │
│   │   │   ├── 🏠 Core Components
│   │   │   ├── Header.jsx               # Navigation header
│   │   │   ├── Footer.jsx               # Footer
│   │   │   ├── Hero.jsx                 # Landing hero section
│   │   │   ├── About.jsx                # About section
│   │   │   ├── Services.jsx             # Services section
│   │   │   ├── Team.jsx                 # Team section
│   │   │   ├── Contact.jsx              # Contact form
│   │   │   │
│   │   │   ├── 🔐 Authentication
│   │   │   ├── Login.jsx                # Login page
│   │   │   ├── Register.jsx             # Registration page
│   │   │   ├── UserContext.jsx          # User context provider
│   │   │   │
│   │   │   ├── 🚨 Emergency System
│   │   │   ├── EmergencyRequest.jsx     # Submit emergency
│   │   │   ├── EmergencyDashboard.jsx   # Admin dashboard
│   │   │   ├── EmergencySuccess.jsx     # Success confirmation
│   │   │   ├── DispatchControl.jsx      # One-click dispatch
│   │   │   ├── DispatchTracker.jsx      # Live tracking map
│   │   │   │
│   │   │   ├── 📦 Inventory Management
│   │   │   ├── InventoryPage.jsx        # Inventory dashboard
│   │   │   ├── InventoryIntegration.jsx # Live inventory view
│   │   │   │
│   │   │   ├── 🗺️ Routing & Maps
│   │   │   ├── RoutingVisualization.jsx # Smart routing UI
│   │   │   ├── DisasterMapSection.jsx   # Disaster map
│   │   │   │
│   │   │   ├── 📊 Analytics
│   │   │   ├── ReliefAnalytics.jsx      # Analytics dashboard
│   │   │   │
│   │   │   └── 👥 User Dashboards
│   │   │       ├── VolunteerPage.jsx    # Volunteer dashboard
│   │   │       └── RecipientPage.jsx    # Recipient dashboard
│   │   │
│   │   ├── 📂 css/                      # Stylesheets
│   │   │   ├── style.css                # Global styles & theme
│   │   │   ├── Header.css               # Header styles
│   │   │   ├── Hero.css                 # Hero section
│   │   │   ├── Emergency.css            # Emergency components
│   │   │   ├── DispatchControl.css      # Dispatch UI
│   │   │   ├── DispatchTracker.css      # Tracker map
│   │   │   ├── RoutingVisualization.css # Routing UI
│   │   │   ├── InventoryPage.css        # Inventory styles
│   │   │   ├── ReliefAnalytics.css      # Analytics styles
│   │   │   └── [other component styles]
│   │   │
│   │   ├── 📂 assets/                   # Assets
│   │   │   └── images/                  # Image assets
│   │   │
│   │   ├── App.js                       # Main app component
│   │   ├── index.js                     # React entry point
│   │   └── index.css                    # Base styles
│   │
│   ├── package.json                     # Frontend dependencies
│   ├── tailwind.config.js               # Tailwind configuration
│   └── README.md                        # Frontend documentation
│
├── 📂 docs/                             # Documentation
│   ├── AI_AGENTS_DOCUMENTATION.md       # AI agents guide
│   ├── IMPROVED_3_AGENTS_SYSTEM.md      # System architecture
│   └── PROJECT_STRUCTURE.md             # This file
│
├── .gitignore                           # Git ignore rules
└── README.md                            # Main project README
```

---

## 🎯 Key Features by Module

### 🚨 Emergency Response System
**Location:** `frontend/src/components/Emergency*.jsx` + `backend/routes/emergency.js`

**Components:**
- `EmergencyRequest.jsx` - User submits emergency
- `EmergencyDashboard.jsx` - Admin views all emergencies
- `DispatchControl.jsx` - One-click automated dispatch
- `DispatchTracker.jsx` - Real-time tracking map

**Backend:**
- `routes/emergency.js` - Emergency API endpoints
- `services/aiAgent.js` - AI emergency processing
- `services/dispatchService.js` - Automated dispatch logic

**Features:**
- ✅ AI-powered emergency analysis
- ✅ Automated resource allocation
- ✅ Real-time dispatch tracking
- ✅ Live map with routes

---

### 📦 Inventory Management
**Location:** `frontend/src/components/Inventory*.jsx` + `backend/routes/inventory.js`

**Components:**
- `InventoryPage.jsx` - Full inventory dashboard
- `InventoryIntegration.jsx` - Live inventory view

**Backend:**
- `routes/inventory.js` - Inventory CRUD API
- `models/Inventory.js` - Inventory data models

**Features:**
- ✅ Real-time stock tracking
- ✅ Low stock alerts
- ✅ Multi-location management
- ✅ Transaction history

---

### 🗺️ Smart Routing System
**Location:** `frontend/src/components/RoutingVisualization.jsx` + `backend/services/routingService.js`

**Components:**
- `RoutingVisualization.jsx` - Interactive routing UI

**Backend:**
- `services/routingService.js` - OSRM integration
- `services/smartRouting.js` - AI routing agent

**Features:**
- ✅ Real road-following routes
- ✅ Disaster zone avoidance
- ✅ Multi-factor optimization
- ✅ Alternative routes

---

### 🤖 AI Agents System
**Location:** `backend/services/`

**Agents:**
1. **NLP Agent** (`nlpEngine.js`) - Sentiment analysis
2. **Image Agent** (`imageDisasterDetection.js`) - Visual analysis
3. **Routing Agent** (`smartRouting.js`) - Route optimization

**Main Controller:**
- `aiAgent.js` - Orchestrates all 3 agents

**Features:**
- ✅ Natural language processing
- ✅ Disaster type detection
- ✅ Severity classification
- ✅ Resource recommendation

---

## 🚀 Quick Start Guide

### Backend Setup
```bash
cd backend
npm install
# Create .env file with MongoDB URI
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Access Points
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Emergency System:** http://localhost:3000/emergency
- **Dispatch Tracker:** http://localhost:3000/dispatch-tracker
- **Admin Dashboard:** http://localhost:3000/emergency-dashboard

---

## 📊 Data Flow

```
User Submits Emergency
        ↓
AI Agent Analyzes (3 agents)
        ↓
Emergency Saved to DB
        ↓
Admin Views Dashboard
        ↓
Admin Clicks Dispatch
        ↓
Dispatch Service:
  - Checks Inventory
  - Allocates Resources
  - Calculates Routes
  - Updates Inventory
        ↓
Real-Time Tracking Map
        ↓
Status Updates (En Route → Delivered)
```

---

## 🎨 Styling System

**Theme Variables:** `frontend/src/css/style.css`
- Dark mode (default)
- Light mode (toggle)
- CSS variables for consistency

**Component Styles:**
- Each component has its own CSS file
- Follows BEM naming convention
- Responsive design (mobile-first)

---

## 🔧 Configuration Files

### Backend
- `.env` - Environment variables (MongoDB, API keys)
- `package.json` - Dependencies and scripts
- `server.js` - Express server configuration

### Frontend
- `package.json` - React dependencies
- `tailwind.config.js` - Tailwind CSS config
- `src/App.js` - Route configuration

---

## 📝 API Endpoints

### Emergency System
- `POST /api/emergency/request` - Submit emergency
- `GET /api/emergency/active` - Get active emergencies
- `POST /api/emergency/dispatch/:id` - Dispatch resources
- `GET /api/emergency/active-dispatches` - Track dispatches
- `PUT /api/emergency/update-status/:id` - Update status

### Inventory
- `GET /api/inventory/items` - Get all items
- `POST /api/inventory/items` - Add item
- `PUT /api/inventory/items/:id` - Update item
- `DELETE /api/inventory/items/:id` - Delete item

### Routing
- `POST /api/agents/calculate-route` - Calculate route
- `GET /api/agents/disaster-zones` - Get disaster zones

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

---

## 🎯 Next Steps for Organization

1. ✅ Move documentation to `docs/` folder
2. ✅ Create `backend/config/` for configuration
3. ✅ Organize test files in `backend/tests/`
4. ✅ Group related components in subfolders
5. ✅ Add API documentation (Swagger/OpenAPI)

---

## 📚 Additional Resources

- **AI Agents:** See `AI_AGENTS_DOCUMENTATION.md`
- **System Design:** See `IMPROVED_3_AGENTS_SYSTEM.md`
- **API Docs:** Coming soon
- **Deployment Guide:** Coming soon

---

**Last Updated:** November 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
