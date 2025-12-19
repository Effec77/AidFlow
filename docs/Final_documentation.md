# AidFlow AI - Complete Project Documentation

## 📋 Project Overview

**AidFlow AI** is an AI-powered disaster relief management system that automates the entire emergency response pipeline - from detecting live disasters to dispatching resources and tracking deliveries in real-time.

### Problem Statement
During natural disasters, emergency response teams face challenges in:
- Quickly identifying and classifying disasters
- Allocating appropriate resources based on disaster type and severity
- Coordinating multiple response centers
- Tracking dispatch status in real-time

### Solution
AidFlow AI addresses these challenges through:
- Real-time disaster data integration from global sources (GDACS)
- AI-powered disaster classification and severity assessment
- Automated resource allocation from inventory
- Live dispatch tracking with route visualization

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Live         │  │ Emergency    │  │ Dispatch     │              │
│  │ Disasters    │──│ Dashboard    │──│ Tracker      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              │ REST API
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Emergency    │  │ Dispatch     │  │ Routing      │              │
│  │ Routes       │  │ Service      │  │ Service      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ AI Agent     │  │ NLP Service  │  │ Live Disaster│              │
│  │ (Analysis)   │  │ (Sentiment)  │  │ Service      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES & DATABASE                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ MongoDB      │  │ GDACS API    │  │ OSRM         │              │
│  │ (Database)   │  │ (Disasters)  │  │ (Routing)    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React.js | UI Framework |
| React Router | Navigation |
| Axios | HTTP Client |
| Leaflet | Interactive Maps |
| Lucide React | Icons |
| CSS3 | Styling |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| Axios | External API calls |

### AI/ML Components
| Component | Purpose |
|-----------|---------|
| NLP Service | Sentiment analysis, urgency detection |
| Disaster Classifier | Categorizes disaster types |
| Resource Planner | Recommends resources based on disaster |

### External APIs
| API | Purpose |
|-----|---------|
| GDACS (Global Disaster Alert) | Real-time disaster data |
| OSRM | Route calculation |
| OpenStreetMap | Map tiles |

---

## 📁 Project Structure

```
AidFlow/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveDisasters.jsx      # Live disaster feed
│   │   │   ├── EmergencyDashboard.jsx # Emergency management
│   │   │   ├── DispatchTracker.jsx    # Real-time tracking
│   │   │   ├── DispatchControl.jsx    # Dispatch actions
│   │   │   └── ...
│   │   ├── css/
│   │   │   ├── LiveDisasters.css
│   │   │   ├── Emergency.css
│   │   │   ├── DispatchTracker.css
│   │   │   └── ...
│   │   └── App.js
│   └── package.json
│
├── backend/
│   ├── routes/
│   │   ├── emergency.js        # Emergency API endpoints
│   │   ├── disasters.js        # Disaster API endpoints
│   │   └── inventory.js        # Inventory API endpoints
│   ├── services/
│   │   ├── dispatchService.js  # Resource allocation & dispatch
│   │   ├── routingService.js   # Route calculation
│   │   ├── liveDisasterService.js # GDACS integration
│   │   └── aiAgent.js          # AI analysis
│   ├── models/
│   │   ├── Emergency.js        # Emergency schema
│   │   ├── Inventory.js        # Inventory schema
│   │   └── DisasterZone.js     # Disaster zone schema
│   └── server.js
│
└── docs/
    └── VIVA_DOCUMENTATION.md
```

---

## 🔄 Complete Application Flow

### Step 1: Live Disaster Detection
```
GDACS API → liveDisasterService.js → LiveDisasters.jsx
```
- System fetches real-time disaster data from GDACS (Global Disaster Alert and Coordination System)
- Filters disasters to India region (bounding box: 8°N-35.5°N, 68.5°E-97.5°E)
- Displays on interactive map with disaster details

### Step 2: Emergency Creation
```
LiveDisasters.jsx → POST /api/emergency/create → AI Analysis
```
- User clicks "Create Emergency" on a disaster
- Backend triggers AI analysis pipeline:
  - **NLP Analysis**: Extracts sentiment, urgency, emotion from description
  - **Disaster Classification**: Identifies type (flood, earthquake, fire, etc.)
  - **Severity Assessment**: Calculates severity (critical/high/medium/low)
  - **Resource Planning**: Recommends immediate and secondary resources

### Step 3: Emergency Dashboard
```
EmergencyDashboard.jsx → GET /api/emergency/active
```
- Displays all active emergencies with:
  - AI analysis results
  - Severity indicators
  - Resource requirements
  - Status tracking

### Step 4: Resource Dispatch
```
DispatchControl.jsx → POST /api/emergency/dispatch/:id → dispatchService.js
```
- One-click automated dispatch:
  1. Identifies required resources from AI analysis
  2. Searches inventory for available items
  3. Allocates from nearest response centers
  4. Calculates optimal routes (OSRM)
  5. Updates inventory (deducts dispatched items)
  6. Updates emergency status to "dispatched"

### Step 5: Live Tracking
```
DispatchTracker.jsx → GET /api/emergency/active-dispatches
```
- Real-time map visualization:
  - Point A: Dispatch center (origin)
  - Point B: Emergency location (destination)
  - Route line connecting A to B
  - Status-based colors (orange=dispatched, blue=en_route, green=delivered)
- Progress tracking with ETA
- Status update buttons (En Route → Complete)

---

## 🗄️ Database Models

### Emergency Model
```javascript
{
  emergencyId: "EMG_1762168217715",
  userId: "user_123",
  userMessage: "Flood in residential area, need immediate help",
  location: {
    lat: 30.5145,
    lon: 76.6600,
    address: "Chandigarh, India"
  },
  status: "dispatched", // received, dispatched, en_route, completed
  aiAnalysis: {
    disaster: { type: "flood", confidence: 0.92 },
    severity: "high",
    sentiment: { urgency: "high", emotion: "fear" }
  },
  response: {
    resources: {
      immediate: ["water", "medical_kit", "rescue_team"],
      secondary: ["shelter", "food"]
    }
  },
  dispatchDetails: {
    dispatchedAt: Date,
    estimatedArrival: Date,
    centers: [{ centerName, resources, route }]
  },
  timeline: [{ status, timestamp, notes }]
}
```

### Inventory Model
```javascript
{
  name: "Medical Kit",
  category: "Medical", // Medical, Food, Shelter, Equipment, Water
  currentStock: 50,
  minThreshold: 10,
  unit: "units",
  location: "Chandigarh Emergency Response Center",
  status: "adequate" // adequate, low, critical
}
```

---

## 🤖 AI Components Explained

### 1. NLP Service (Sentiment Analysis)
**Purpose**: Analyzes emergency messages to extract emotional context and urgency.

**Input**: "Flood in our area! Water level rising fast, children trapped!"

**Output**:
```javascript
{
  sentiment: "negative",
  urgency: "critical",
  emotion: { primary: { label: "fear", score: 0.89 } },
  keywords: ["flood", "water", "trapped", "children"]
}
```

### 2. Disaster Classifier
**Purpose**: Identifies disaster type from description and context.

**Classification Categories**:
- Flood
- Earthquake
- Fire
- Cyclone
- Landslide
- Industrial Accident
- Medical Emergency

**Output**:
```javascript
{
  type: "flood",
  confidence: 0.92,
  subType: "flash_flood"
}
```

### 3. Resource Planner
**Purpose**: Recommends resources based on disaster type and severity.

**Logic**:
```javascript
// Example for flood
if (disasterType === 'flood') {
  immediate: ['rescue_boat', 'life_jackets', 'water_pumps']
  secondary: ['shelter', 'clean_water', 'medical_supplies']
}
```

---

## 🛣️ API Endpoints

### Emergency Routes (`/api/emergency`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create new emergency with AI analysis |
| GET | `/active` | Get all active emergencies |
| GET | `/active-dispatches` | Get dispatched emergencies for tracking |
| POST | `/dispatch/:id` | Dispatch resources for emergency |
| PUT | `/update-status/:id` | Update emergency status |
| PUT | `/complete/:id` | Mark emergency as completed |
| DELETE | `/:id` | Delete emergency |
| GET | `/analytics` | Get emergency statistics |

### Disaster Routes (`/api/disasters`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/live` | Fetch live disasters from GDACS |
| POST | `/import` | Import disaster to local DB |
| GET | `/` | Get all stored disasters |

### Inventory Routes (`/api/inventory`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all inventory items |
| POST | `/` | Add new inventory item |
| PUT | `/:id` | Update inventory item |
| GET | `/locations` | Get all response center locations |

---

## 🎯 Key Features

### 1. Real-Time Disaster Feed
- Integrates with GDACS for live disaster data
- Geographic filtering (India-focused)
- Interactive map visualization
- One-click import to local database

### 2. AI-Powered Analysis
- Automatic disaster classification
- Severity assessment
- Sentiment and urgency detection
- Smart resource recommendations

### 3. Automated Dispatch System
- One-click resource allocation
- Inventory-aware dispatching
- Nearest center selection
- Automatic stock updates

### 4. Live Tracking Dashboard
- Real-time map with routes
- A→B visualization (center to emergency)
- Progress tracking with ETA
- Status management (dispatched → en_route → completed)

### 5. Inventory Management
- Stock level monitoring
- Threshold alerts
- Multi-location support
- Category-based organization

---

## 🚀 How to Run the Project

### Prerequisites
- Node.js (v16+)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd AidFlow/backend
npm install
# Create .env file with:
# MONGODB_URI=mongodb://localhost:27017/aidflow
# PORT=5000
npm run dev
```

### Frontend Setup
```bash
cd AidFlow/frontend
npm install
npm start
```

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 📊 Demo Flow for Viva

1. **Show Live Disasters Page**
   - Explain GDACS integration
   - Show India filter
   - Click on a disaster marker

2. **Create Emergency**
   - Click "Create Emergency" button
   - Explain AI analysis happening in background
   - Show the emergency created in dashboard

3. **Emergency Dashboard**
   - Click on emergency card
   - Show AI analysis results (disaster type, severity, resources)
   - Explain the modal sections

4. **Dispatch Resources**
   - Click "Dispatch Emergency Response"
   - Explain inventory allocation
   - Show dispatched resources

5. **Track Dispatch**
   - Navigate to Dispatch Tracker
   - Show A→B route on map
   - Explain status progression
   - Mark as "En Route" then "Complete"

---

## 💡 Potential Viva Questions & Answers

### Q1: What is the main purpose of AidFlow AI?
**A**: AidFlow AI automates disaster relief management by integrating real-time disaster detection, AI-powered analysis, automated resource dispatch, and live tracking into a single platform.

### Q2: How does the AI analysis work?
**A**: When an emergency is created, the system runs three AI components:
1. NLP Service - analyzes text for sentiment and urgency
2. Disaster Classifier - identifies disaster type with confidence score
3. Resource Planner - recommends appropriate resources based on disaster type

### Q3: How is resource allocation handled?
**A**: The dispatch service:
1. Gets required resources from AI analysis
2. Searches inventory by item name, then category
3. Allocates from nearest response centers
4. Calculates routes using OSRM
5. Deducts quantities from inventory

### Q4: What external APIs are used?
**A**: 
- GDACS (Global Disaster Alert) - for live disaster data
- OSRM (Open Source Routing Machine) - for route calculation
- OpenStreetMap - for map tiles

### Q5: How is real-time tracking implemented?
**A**: The Dispatch Tracker component polls the backend every 10 seconds for active dispatches. It renders markers for dispatch centers and emergencies, connected by polylines showing the route.

### Q6: What database is used and why?
**A**: MongoDB is used because:
- Flexible schema for varying disaster data
- Good for geospatial queries (location-based)
- Easy to scale
- JSON-like documents match our data structure

### Q7: How do you handle inventory shortages?
**A**: The system tracks "unmet needs" - if requested resources aren't available, it still dispatches what's available and reports the shortfall in the response.

### Q8: What happens if the GDACS API is down?
**A**: The system gracefully handles API failures with try-catch blocks and returns appropriate error messages. Previously imported disasters remain in the local database.

---

## 🔮 Future Enhancements

1. **Mobile App** - React Native version for field workers
2. **Push Notifications** - Alert responders of new emergencies
3. **Predictive Analytics** - ML model to predict disaster-prone areas
4. **Multi-language Support** - For diverse user base
5. **Volunteer Management** - Coordinate volunteer responders
6. **Drone Integration** - Aerial assessment and delivery
7. **Blockchain** - Transparent resource tracking

---

## 👥 Team

- **Project**: AidFlow AI
- **Type**: Disaster Relief Management System
- **Stack**: MERN (MongoDB, Express, React, Node.js)

---

*Good luck with your viva! 🎓*
