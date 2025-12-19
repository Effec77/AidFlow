# System Architecture & Interrelations

## Overview
AidFlow is a full-stack disaster relief management system with AI-powered emergency response, inventory management, and real-time tracking.

---

## Architecture Layers

### Frontend (React)
- **Location:** `frontend/src/`
- **Framework:** React with React Router
- **Key Components:**
  - `EmergencyRequest.jsx` - Emergency submission
  - `EmergencyDashboard.jsx` - Admin emergency management
  - `DispatchTracker.jsx` - Real-time dispatch tracking
  - `InventoryPage.jsx` - Inventory management
  - `LiveDisasters.jsx` - Disaster zone visualization
  - `RoutingVisualization.jsx` - Route display

### Backend (Node.js/Express)
- **Location:** `backend/`
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Key Modules:**
  - Routes: `routes/emergency.js`, `routes/disasters.js`, `routes/inventory.js`, `routes/agents.js`
  - Services: `services/aiAgent.js`, `services/dispatchService.js`, `services/routingService.js`
  - Models: `models/Emergency.js`, `models/Inventory.js`, `models/DisasterZone.js`

### AI Agents (Python/Node.js)
- **Location:** `agents/`, `backend/services/`
- **Agents:**
  - Agent 1: Emergency AI Agent (Node.js)
  - Agent 2: Image Detection Agent (Node.js)
  - Agent 3: Smart Routing Agent (Node.js)
  - Python Agent: Disaster Data Fetcher (Python)

---

## Data Flow

### Emergency Request Flow
```
User submits emergency
    ↓
POST /api/emergency/request
    ↓
EmergencyAIAgent.processEmergencyRequest()
    ├──→ NLPEngine.analyzeEmergencyText() (Agent 1)
    ├──→ gatherLocationIntelligence() (satellite/weather)
    ├──→ analyzeDisasterType()
    ├──→ determineResourceNeeds()
    └──→ SmartRoutingAgent.calculateOptimalRoute() (Agent 3)
    ↓
Create Emergency model
    ↓
Reserve inventory resources
    ↓
Return emergency ID + analysis
```

### Dispatch Flow
```
Admin clicks "Dispatch"
    ↓
POST /api/emergency/dispatch/:emergencyId
    ↓
DispatchService.dispatchEmergency()
    ├──→ Get emergency details
    ├──→ allocateResources() (from inventory)
    ├──→ calculateDispatchRoutes() (Agent 3)
    ├──→ updateInventoryAfterDispatch()
    └──→ Update emergency status
    ↓
Return dispatch details + routes
```

### Image Analysis Flow
```
User uploads image
    ↓
POST /api/emergency/analyze-image
    ↓
ImageDisasterDetectionAgent.detectDisasterFromImage()
    ├──→ runEfficientNetPrediction() (ML model)
    ├──→ getNASADisasterData() (FIRMS, EONET)
    └──→ combineDetections()
    ↓
Return detection results + labels
```

---

## Model Relationships

### Emergency Model
```javascript
Emergency {
  emergencyId: String
  userId: ObjectId → User
  location: { lat, lon, address }
  userMessage: String
  aiAnalysis: {
    disaster: { type, confidence, priority },
    nlp: { sentiment, emotion, urgency },
    severity: String
  }
  response: {
    resources: { immediate, secondary, quantities },
    routing: { ... } // From Agent 3
  }
  dispatchDetails: {
    centers: [...],
    routes: [...]
  }
  status: String
  timeline: [...]
}
```

**Relationships:**
- Links to `User` (requester)
- Links to `DisasterZone` (optional)
- Uses `InventoryItem` (resource allocation)
- Creates `RoutingHistory` entries

### Inventory Model
```javascript
InventoryItem {
  name: String
  category: String (Medical, Food, Shelter, Equipment, Water)
  currentStock: Number
  minThreshold: Number
  maxCapacity: Number
  location: String → Location
  status: String (critical, low, adequate)
}

Donation {
  volunteerId: ObjectId → User
  itemName: String
  quantity: Number
  status: String (pending, approved, rejected)
}

Request {
  requesterId: ObjectId → User
  itemName: String
  quantity: Number
  status: String (pending, approved, delivered)
}
```

**Relationships:**
- `InventoryItem` → `Location` (warehouse/center)
- `Donation` → `User` (volunteer)
- `Request` → `User` (recipient)
- Updated by `DispatchService` (automatic deduction)

### DisasterZone Model
```javascript
DisasterZone {
  zoneId: String
  name: String
  disasterType: String
  severity: String
  location: {
    center: { lat, lon },
    radius: Number,
    affectedArea: Number
  }
  affectedPopulation: { estimated: Number }
  status: String (active, resolved)
  alerts: [...]
}
```

**Relationships:**
- Links to multiple `Emergency` records
- Created by Python disaster agent or manual entry

---

## Service Interconnections

### DispatchService
**Dependencies:**
- `Emergency` model
- `InventoryItem` model
- `Location` model
- `RoutingService` (Agent 3)

**Functions:**
- `dispatchEmergency()` - Main dispatch orchestration
- `allocateResources()` - Inventory allocation
- `calculateDispatchRoutes()` - Route calculation
- `updateInventoryAfterDispatch()` - Stock deduction

### EmergencyAIAgent
**Dependencies:**
- `NLPEngine` (Agent 1 functionality)
- `ImageDisasterDetectionAgent` (Agent 2)
- `SmartRoutingAgent` (Agent 3)

**Functions:**
- `processEmergencyRequest()` - Main orchestration
- `gatherLocationIntelligence()` - Satellite/weather data
- `analyzeDisasterType()` - Disaster classification
- `determineResourceNeeds()` - Resource planning

### RoutingService
**Dependencies:**
- OSRM API (external)
- Traffic/weather APIs (optional)

**Functions:**
- `calculateRoute()` - Route calculation
- Used by `DispatchService` and `SmartRoutingAgent`

---

## API Route Dependencies

```
/api/emergency/request
    ├──→ EmergencyAIAgent
    │   ├──→ NLPEngine
    │   ├──→ SmartRoutingAgent
    │   └──→ ImageDisasterDetectionAgent (optional)
    ├──→ Emergency model (create)
    └──→ InventoryItem model (reserve)

/api/emergency/dispatch/:emergencyId
    ├──→ DispatchService
    │   ├──→ Emergency model (read)
    │   ├──→ InventoryItem model (allocate)
    │   ├──→ Location model (read)
    │   └──→ RoutingService (calculate routes)
    └──→ Emergency model (update)

/api/emergency/analyze-image
    └──→ ImageDisasterDetectionAgent
        ├──→ EfficientNet B3 model
        └──→ NASA APIs (FIRMS, EONET)

/api/disasters/zones
    └──→ DisasterZone model (CRUD)

/api/inventory/items
    └──→ InventoryItem model (CRUD)

/api/inventory/donations
    ├──→ Donation model (create)
    └──→ InventoryItem model (update on approve)

/api/inventory/requests
    ├──→ Request model (create)
    └──→ InventoryItem model (deduct on approve)

/api/agents/calculate-route
    └──→ RoutingService
        └──→ OSRM API
```

---

## Frontend-Backend Integration

### Component → API Mapping

| Component | API Endpoints |
|-----------|--------------|
| `EmergencyRequest` | `POST /api/emergency/request`, `POST /api/emergency/analyze-image` |
| `EmergencyDashboard` | `GET /api/emergency/active`, `POST /api/emergency/dispatch/:id` |
| `DispatchTracker` | `GET /api/emergency/active-dispatches`, `GET /api/emergency/dispatch-status/:id` |
| `InventoryPage` | `GET /api/inventory/items`, `POST /api/inventory/items` |
| `VolunteerPage` | `POST /api/donations`, `GET /api/donations` |
| `RecipientPage` | `POST /api/requests`, `GET /api/requests` |
| `LiveDisasters` | `GET /api/disasters/zones`, `GET /api/disasters/analytics` |
| `RoutingVisualization` | `POST /api/agents/calculate-route` |
| `ReliefAnalytics` | `GET /api/emergency/analytics`, `GET /api/disasters/analytics` |

---

## External Integrations

### APIs Used
- **OSRM** - Open Source Routing Machine (free routing)
- **OpenWeather** - Weather data
- **NASA FIRMS** - Fire detection
- **NASA EONET** - Natural disaster events
- **Hugging Face** - NLP models (sentiment, emotion, NER)
- **OpenStreetMap Overpass** - Infrastructure data

### Data Sources
- **USGS** - Earthquake data (Python agent)
- **NASA FIRMS** - Fire data (Python agent + Agent 2)
- **CSV Predictions** - Pre-computed disaster predictions

---

## Authentication & Authorization

### Middleware
- `protect` - JWT token verification
- `authorize` - Role-based access control

### Roles
- **admin** - Full access
- **volunteer** - Donation submission
- **affected citizen** - Request submission
- **branch manager** - Limited admin access

---

## Key Design Patterns

1. **Service Layer Pattern** - Business logic in services, not routes
2. **Agent Pattern** - Specialized AI agents for different tasks
3. **Repository Pattern** - Models abstract database operations
4. **Middleware Pattern** - Authentication/authorization middleware
5. **Factory Pattern** - Agent creation and configuration

---

## Data Consistency

### Transactions
- `DispatchService` uses MongoDB transactions for atomic inventory updates
- Ensures inventory consistency during dispatch

### Eventual Consistency
- Python disaster agent runs hourly (eventual consistency for disaster data)
- Real-time updates for emergency/dispatch status

---

## Scalability Considerations

- **Stateless API** - JWT-based authentication
- **Database Indexing** - On emergencyId, zoneId, userId
- **Caching** - Can add Redis for frequently accessed data
- **Background Jobs** - Python agent runs separately
- **API Rate Limiting** - Can add rate limiting middleware

