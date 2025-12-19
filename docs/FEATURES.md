# Features Documentation

## Overview
AidFlow is a disaster relief management system with AI-powered emergency response, inventory management, and real-time tracking capabilities.

---

## Core Features

### 1. Emergency Request System
**Components:** `EmergencyRequest.jsx`, `EmergencyDashboard.jsx`

**Flow:**
1. User submits emergency with location + message
2. AI Agent 1 analyzes text (NLP sentiment/urgency)
3. System gathers satellite/environmental data
4. AI determines disaster type and severity
5. System reserves required resources from inventory
6. AI Agent 3 calculates optimal route
7. Emergency created with full analysis

**Key Features:**
- Real-time AI analysis
- Automatic resource allocation
- Smart routing calculation
- Status tracking with timeline

**Backend:** `/api/emergency/request`

---

### 2. Consistent Dispatch System
**Components:** `DispatchControl.jsx`, `DispatchTracker.jsx`, `EmergencyDashboard.jsx`

**Automatic Dispatch (High/Critical Severity):**
1. AI analyzes emergency and determines high/critical severity
2. System automatically:
   - Allocates resources from nearest centers
   - Calculates routes for each center
   - Updates inventory (deducts stock)
   - Creates dispatch records
   - Updates emergency status to "dispatched"

**Manual Dispatch (Medium/Low Severity):**
1. AI analyzes emergency and determines medium/low severity
2. System creates dispatch request for admin approval
3. Admin reviews request in dashboard
4. Upon approval, same automated process executes

**Key Features:**
- Severity-based dispatch logic
- Automatic vs manual approval workflow
- Real-time inventory updates
- Multi-center dispatch support
- Route optimization

**Backend:** `/api/emergency/dispatch/:emergencyId`

---

### 3. Inventory Management
**Components:** `InventoryPage.jsx`, `InventoryIntegration.jsx`

**Features:**
- **Items Management:** CRUD operations for inventory items
- **Location Tracking:** Multiple warehouse/center locations
- **Stock Monitoring:** Real-time stock levels with thresholds
- **Transactions:** Complete audit trail
- **Status Alerts:** Critical/Low/Adequate based on thresholds

**User Roles:**
- **Admin:** Full inventory control
- **Volunteer:** Submit donations
- **Recipient:** Request items

**Backend:** `/api/inventory/*`, `/api/donations`, `/api/requests`

---

### 4. Live Disaster Tracking
**Components:** `LiveDisasters.jsx`, `DisasterMapSection.jsx`

**Features:**
- **Real-time Zones:** Active disaster zones on map
- **Disaster Types:** Fire, Flood, Earthquake, Landslide, Storm
- **Severity Levels:** Critical, High, Medium, Low
- **Zone Management:** Create, update, resolve zones
- **Emergency Linking:** View emergencies per zone

**Data Sources:**
- Manual zone creation
- Python disaster agent (USGS earthquakes, NASA FIRMS fires)
- Disaster prediction CSV

**Backend:** `/api/disasters/*`

---

### 5. Smart Routing & Re-routing
**Components:** `RoutingVisualization.jsx`, `DispatchTracker.jsx`

**Features:**
- **Route Calculation:** Optimal paths from centers to emergencies
- **Real-time Factors:** Traffic, weather, road conditions
- **Re-routing:** Automatic route updates based on changing conditions
- **Multi-route Support:** Alternative routes for backup
- **ETA Calculation:** AI-adjusted arrival times

**AI Agent:** Agent 3 (SmartRoutingAgent)

**Backend:** `/api/agents/calculate-route`, `/api/emergency/reroute/:emergencyId`

---

### 6. Image-Based Disaster Detection
**Component:** `EmergencyRequest.jsx` (image upload)

**Features:**
- **EfficientNet B3 Model:** Deep learning disaster classification
- **NASA Integration:** FIRMS fire data, EONET events
- **Combined Analysis:** Model predictions + satellite corroboration
- **Confidence Scoring:** Multi-source confidence calculation

**AI Agent:** Agent 2 (ImageDisasterDetectionAgent)

**Backend:** `/api/emergency/analyze-image`

---

### 7. Role-Based Dashboards

#### Admin Dashboard
**Component:** `InventoryPage.jsx` + `ReliefAnalytics.jsx`

**Features:**
- Full inventory management
- Emergency dispatch control
- Analytics and statistics
- Donation/request approvals

#### Volunteer Dashboard
**Component:** `VolunteerPage.jsx`

**Features:**
- Submit donations
- Track donation status
- View inventory needs

#### Recipient Dashboard
**Component:** `RecipientPage.jsx`

**Features:**
- Submit item requests
- Track request status
- View available resources

---

### 8. Analytics & Reporting
**Component:** `ReliefAnalytics.jsx`

**Features:**
- Emergency statistics (by status, type, severity)
- Disaster zone analytics
- Inventory utilization
- Routing performance
- Response time metrics

**Backend:** `/api/emergency/analytics`, `/api/disasters/analytics`, `/api/agents/analytics/*`

---

### 9. Real-Time Tracking
**Components:** `DispatchTracker.jsx`, `EmergencyDashboard.jsx`

**Features:**
- Live dispatch status
- Route visualization on map
- ETA updates
- Status timeline
- Location tracking

---

## Feature Interconnections

```
Emergency Request
    ↓
AI Analysis (Agent 1, 2, 3)
    ↓
Resource Allocation
    ↓
Inventory Check
    ↓
Route Calculation
    ↓
Dispatch
    ↓
Real-time Tracking
    ↓
Completion
```

**Key Integrations:**
- Emergency → Inventory (automatic resource reservation)
- Emergency → Routing (optimal path calculation)
- Emergency → Dispatch (one-click automation)
- Disaster Zones → Emergencies (spatial linking)
- Inventory → Donations/Requests (volunteer/recipient flow)

---

## Frontend Routes

- `/` - Home page with disaster map
- `/register`, `/login` - Authentication
- `/inventory` - Admin inventory dashboard
- `/volunteer` - Volunteer donation dashboard
- `/recipient` - Recipient request dashboard
- `/emergency` - Emergency request form
- `/emergency-dashboard` - Emergency management
- `/dispatch-tracker` - Real-time dispatch tracking
- `/live-disasters` - Live disaster zones map
- `/routing` - Route visualization
- `/analytics` - Analytics dashboard

