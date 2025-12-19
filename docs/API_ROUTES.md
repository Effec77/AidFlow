# API Routes Documentation

## Overview
AidFlow backend exposes RESTful APIs organized into route modules for emergency management, disaster tracking, inventory, and AI agents.

---

## Authentication Routes (`/api/register`, `/api/login`)
**Location:** `backend/server.js`

- **POST /api/register** - User registration (creates User model)
- **POST /api/login** - User authentication (returns JWT token)

**Relationships:**
- Creates `User` model entries
- Token used for protected routes via `protect` middleware

---

## Emergency Routes (`/api/emergency/*`)
**Location:** `backend/routes/emergency.js`

### Core Emergency Management
- **POST /api/emergency/request** - Submit emergency request
  - Uses `EmergencyAIAgent` (Agent 1) for analysis
  - Creates `Emergency` model
  - Reserves inventory resources automatically
  - Returns emergency ID and AI analysis

- **GET /api/emergency/status/:emergencyId** - Get emergency status
- **GET /api/emergency/active** - List all active emergencies
- **PUT /api/emergency/update/:emergencyId** - Update emergency status
- **GET /api/emergency/analytics** - Emergency statistics

### Image Analysis (Agent 2)
- **POST /api/emergency/analyze-image** - Analyze disaster from image
  - Uses `ImageDisasterDetectionAgent` (Agent 2)
  - Combines EfficientNet B3 model + NASA satellite data

### Routing (Agent 3)
- **POST /api/emergency/reroute/:emergencyId** - Request re-routing
  - Uses `SmartRoutingAgent` (Agent 3)
  - Updates route based on real-time conditions

### Dispatch System
- **POST /api/emergency/dispatch/:emergencyId** - One-click dispatch
  - Uses `DispatchService` for automated resource allocation
  - Integrates: Emergency → Inventory → Routing → Dispatch
  - Updates inventory stock automatically

- **GET /api/emergency/dispatch-status/:emergencyId** - Get dispatch tracking
- **GET /api/emergency/active-dispatches** - All active dispatches
- **PUT /api/emergency/update-status/:emergencyId** - Update dispatch status
- **PUT /api/emergency/complete/:emergencyId** - Mark as completed
- **GET /api/emergency/completed** - List completed emergencies
- **DELETE /api/emergency/:emergencyId** - Delete completed emergency

**Relationships:**
- Creates/updates `Emergency` model
- Integrates with `Inventory` (reserves resources)
- Uses all 3 AI Agents
- Links to `DisasterZone` via `disasterZoneId`

---

## Disaster Routes (`/api/disasters/*`)
**Location:** `backend/routes/disasters.js`

### Disaster Zones
- **GET /api/disasters/zones** - List disaster zones (filterable by status/type/severity)
- **POST /api/disasters/zones** - Create new disaster zone
- **PUT /api/disasters/zones/:zoneId** - Update disaster zone
- **DELETE /api/disasters/zones/:zoneId** - Resolve disaster zone (soft delete)

### Analytics
- **GET /api/disasters/analytics** - Disaster statistics and breakdowns

### Integration
- **GET /api/disasters/zones/:zoneId/emergencies** - Get emergencies linked to zone

**Relationships:**
- Manages `DisasterZone` model
- Links to `Emergency` model
- Used by `LiveDisasters` frontend component

---

## Inventory Routes (`/api/inventory/*`, `/api/donations`, `/api/requests`)
**Location:** `backend/routes/inventory.js`

### Inventory Items
- **GET /api/inventory/items** - List all items (filterable)
- **POST /api/inventory/items** - Add new item
- **PUT /api/inventory/items/:id** - Update item
- **DELETE /api/inventory/items/:id** - Delete item

### Locations
- **GET /api/inventory/locations** - List all locations
- **POST /api/inventory/locations** - Add new location

### Transactions
- **GET /api/inventory/transactions** - List transactions
- **POST /api/inventory/transactions** - Create transaction

### Donations (Volunteer)
- **GET /api/donations** - List donations
- **POST /api/donations** - Submit donation (creates `Donation` model)
- **PUT /api/donations/:id** - Approve/reject donation
  - If approved, adds to `InventoryItem` stock

### Requests (Recipient)
- **GET /api/requests** - List requests
- **POST /api/requests** - Submit request (creates `Request` model)
- **PUT /api/requests/:id** - Approve/reject request
  - If approved, deducts from `InventoryItem` stock

**Relationships:**
- Manages `InventoryItem`, `Location`, `Transaction`, `Donation`, `Request` models
- Used by `InventoryPage`, `VolunteerPage`, `RecipientPage` frontend components
- Integrated with `DispatchService` for automatic stock deduction

---

## Agents Routes (`/api/agents/*`)
**Location:** `backend/routes/agents.js`

### CRUD Operations
- **POST /api/agents/severity-logs** - Create severity log
- **GET /api/agents/severity-logs** - List severity logs
- **GET /api/agents/severity-logs/:logId** - Get single log
- **PUT /api/agents/severity-logs/:logId** - Update log
- **DELETE /api/agents/severity-logs/:logId** - Delete log

Similar CRUD for:
- `/api/agents/disaster-zones/*`
- `/api/agents/routing-history/*`
- `/api/agents/agent-outputs/*`

### Analytics
- **GET /api/agents/analytics/severity-stats** - Severity statistics
- **GET /api/agents/analytics/zone-stats** - Zone statistics
- **GET /api/agents/analytics/routing-stats** - Routing statistics

### Routing (Agent 3)
- **POST /api/agents/calculate-route** - Calculate optimal route
  - Uses `RoutingService` (Agent 3 functionality)
  - Returns route with waypoints, distance, ETA

**Relationships:**
- Manages `SeverityLog`, `DisasterZone`, `RoutingHistory`, `AgentOutput` models
- Used for agent output tracking and analytics

---

## Disaster Predictions (`/api/disaster-predictions`)
**Location:** `backend/server.js`

- **GET /api/disaster-predictions** - Get disaster prediction data from CSV
  - Reads `predictions_with_coords.csv`
  - Filters by probability threshold (0.5)
  - Returns GeoJSON-compatible format

**Relationships:**
- Used by `DisasterMapSection` frontend component
- Displays predicted disaster locations on map

---

## Route Dependencies

```
Emergency Routes
├── Uses: EmergencyAIAgent (Agent 1)
├── Uses: ImageDisasterDetectionAgent (Agent 2)
├── Uses: SmartRoutingAgent (Agent 3)
├── Uses: DispatchService
├── Creates: Emergency model
└── Updates: InventoryItem (reserves resources)

Disaster Routes
├── Manages: DisasterZone model
└── Links: Emergency model (via disasterZoneId)

Inventory Routes
├── Manages: InventoryItem, Location, Transaction
├── Manages: Donation (Volunteer)
└── Manages: Request (Recipient)

Agents Routes
├── Manages: SeverityLog, RoutingHistory, AgentOutput
└── Uses: RoutingService (Agent 3)
```

