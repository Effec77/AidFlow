# Database Schema & Relationships Documentation

## Overview
AidFlow uses MongoDB with Mongoose ODM. This document details all collections, their schemas, relationships, and role-based access control.

---

## Table of Contents
1. [User Model](#user-model)
2. [Emergency Model](#emergency-model)
3. [DisasterZone Model](#disasterzone-model)
4. [Inventory Models](#inventory-models)
5. [Routing Models](#routing-models)
6. [Agent Models](#agent-models)
7. [Disaster Model](#disaster-model)
8. [Relationships Diagram](#relationships-diagram)
9. [Role-Based Access Control](#role-based-access-control)

---

## User Model

**Collection:** `users`  
**File:** `backend/models/User.js`

### Schema
```javascript
{
  // Authentication
  username: String (required, unique, trimmed)
  password: String (required, minlength: 6, hashed with bcrypt)
  role: String (enum: ['admin', 'branch manager', 'volunteer', 'affected citizen'], default: 'volunteer')
  
  // Personal Information
  firstName: String (required, trimmed)
  lastName: String (required, trimmed)
  gender: String (enum: ['', 'Male', 'Female', 'Other'], default: '')
  
  // Location
  country: String (required, trimmed)
  state: String (required, trimmed)
  city: String (required, trimmed)
  address: String (required, trimmed)
  
  // Affiliation
  companyType: String (required, enum: ['NGO', 'Private', 'Individual', 'Government Employee', ''])
  occupation: String (required, trimmed)
  volunteerSkills: [String] (default: [])
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Indexes
- `username` (unique)

### Relationships
- Referenced by: `Emergency.userId`, `Emergency.assignedTeam`, `Emergency.dispatchDetails.dispatchedBy`, `Emergency.timeline[].updatedBy`
- Referenced by: `Donation.volunteerId`, `Request.requesterId`
- Referenced by: `RoutingHistory.userId`, `SeverityLog.userId`, `AgentOutput.userId`

---

## Emergency Model

**Collection:** `emergencies`  
**File:** `backend/models/Emergency.js`

### Schema
```javascript
{
  // Identifiers
  emergencyId: String (required, unique) // Format: "EMG_<timestamp>"
  userId: ObjectId (required, ref: 'User') // Requester
  assignedTeam: ObjectId (ref: 'User') // Assigned responder
  
  // Location
  location: {
    lat: Number (required)
    lon: Number (required)
    address: String
  }
  
  // User Input
  userMessage: String (required, maxlength: 500)
  
  // AI Analysis
  aiAnalysis: {
    disaster: {
      type: String (enum: ['fire', 'flood', 'earthquake', 'landslide', 'storm', 'unknown'])
      confidence: Number (min: 0, max: 1)
      indicators: [String]
      priority: String (enum: ['low', 'medium', 'high', 'critical'])
    }
    sentiment: {
      urgency: String (enum: ['low', 'medium', 'high', 'critical'])
      emotion: String
      keywords: [String]
      score: Number (min: 0, max: 1)
    }
    severity: String (enum: ['low', 'medium', 'high', 'critical'])
  }
  
  // Resource Planning
  response: {
    resources: {
      immediate: [String]
      secondary: [String]
      quantities: Map<String, Number>
    }
  }
  
  // Status
  status: String (enum: ['received', 'analyzing', 'dispatched', 'en_route', 'delivered', 'completed', 'cancelled'], default: 'received')
  
  // Dispatch Details
  dispatchDetails: {
    dispatchedAt: Date
    dispatchedBy: ObjectId (ref: 'User') // Admin who dispatched
    centers: [{
      centerId: String
      centerName: String
      resources: [{
        itemId: String
        name: String
        category: String
        quantity: Number
        unit: String
      }]
      route: {
        distance: Number (km)
        duration: Number (minutes)
        eta: Date
        waypoints: [{
          lat: Number
          lon: Number
        }]
      }
    }]
    totalResources: Map<String, Number>
    estimatedArrival: Date
    actualArrival: Date
    deliveryNotes: String
  }
  
  // Satellite Data
  satelliteData: {
    weather: Mixed
    fires: [Mixed]
    satellite: Mixed
  }
  
  // Timeline
  timeline: [{
    status: String
    timestamp: Date (default: Date.now)
    notes: String
    updatedBy: ObjectId (ref: 'User')
  }]
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Indexes
- `emergencyId` (unique)
- `location.lat, location.lon` (geospatial)
- `status, createdAt` (compound, descending)
- `aiAnalysis.severity, createdAt` (compound, descending)

### Relationships
- **References:** `User` (userId, assignedTeam, dispatchDetails.dispatchedBy, timeline[].updatedBy)
- **Referenced by:** `RoutingHistory.emergencyId`, `AgentOutput.linkedEntities.emergencyId`
- **Optional Link:** `DisasterZone` (via disasterZoneId field in some queries)

---

## DisasterZone Model

**Collection:** `disasterzones`  
**File:** `backend/models/DisasterZone.js`

### Schema
```javascript
{
  // Identifiers
  zoneId: String (required, unique) // Format: "ZONE_<timestamp>"
  name: String (required)
  
  // Disaster Information
  disasterType: String (required, enum: ['fire', 'flood', 'earthquake', 'landslide', 'storm', 'cyclone', 'tsunami', 'multiple'])
  severity: String (required, enum: ['low', 'medium', 'high', 'critical'])
  status: String (enum: ['active', 'monitoring', 'contained', 'resolved', 'archived'], default: 'active')
  
  // Location
  location: {
    center: {
      lat: Number (required)
      lon: Number (required)
    }
    radius: Number (required) // in kilometers
    affectedArea: Number // in square kilometers
    polygon: [[Number]] // Array of [lat, lon] coordinates
  }
  
  // Population Impact
  affectedPopulation: {
    estimated: Number
    evacuated: Number
    casualties: Number
    injured: Number
  }
  
  // Resources
  resources: {
    required: [String]
    allocated: [String]
    deployed: [String]
    shortfall: [String]
  }
  
  // Accessibility
  accessibilityStatus: {
    roadAccess: String (enum: ['open', 'restricted', 'blocked', 'unknown'], default: 'unknown')
    airAccess: String (enum: ['available', 'limited', 'unavailable'], default: 'available')
    waterAccess: String (enum: ['available', 'limited', 'unavailable'], default: 'unknown')
    hazards: [String]
  }
  
  // Detection Metadata
  detectedBy: {
    agents: [String] // ['nlp_agent', 'cv_agent']
    sources: [String] // ['satellite', 'drone', 'ground_report', 'social_media']
    firstDetected: Date
    lastUpdated: Date
  }
  
  // Alerts
  alerts: [{
    level: String (enum: ['info', 'warning', 'danger', 'critical'])
    message: String
    timestamp: Date (default: Date.now)
  }]
  
  // Additional Data
  metadata: Mixed
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Indexes
- `zoneId` (unique)
- `status, severity` (compound)
- `location.center.lat, location.center.lon` (geospatial)
- `disasterType, status` (compound)

### Relationships
- **Referenced by:** `Emergency` (via disasterZoneId in queries)
- **Referenced by:** `AgentOutput.linkedEntities.disasterZoneId`

---

## Inventory Models

### InventoryItem Model

**Collection:** `inventoryitems`  
**File:** `backend/models/Inventory.js`

#### Schema
```javascript
{
  // Basic Information
  name: String (required, trimmed)
  category: String (required, enum: ['Medical', 'Food', 'Shelter', 'Equipment', 'Water'])
  unit: String (required) // e.g., 'units', 'kg', 'liters'
  
  // Stock Management
  currentStock: Number (required, min: 0)
  minThreshold: Number (default: 0)
  maxCapacity: Number (default: 1000)
  status: String (required, enum: ['critical', 'low', 'adequate'])
  
  // Location
  location: ObjectId (required, ref: 'Location') // Warehouse/center
  
  // Financial
  cost: Number (required, min: 0)
  supplier: String (required)
  
  // Metadata
  lastUpdated: Date (default: Date.now)
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

#### Relationships
- **References:** `Location` (location)
- **Referenced by:** `SeverityLog.resourcesAllocated.items[]`

---

### Location Model

**Collection:** `locations`  
**File:** `backend/models/Inventory.js`

#### Schema
```javascript
{
  // Basic Information
  name: String (required, unique, trimmed)
  type: String (required) // e.g., 'warehouse', 'response_center', 'hospital'
  capacity: String // Storage capacity description
  
  // Coordinates
  coordinates: {
    lat: Number (required)
    lon: Number (required)
  }
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

#### Relationships
- **Referenced by:** `InventoryItem.location`

---

### Transaction Model

**Collection:** `transactions`  
**File:** `backend/models/Inventory.js`

#### Schema
```javascript
{
  // Transaction Details
  type: String (required, enum: ['inbound', 'outbound', 'request'])
  item: String (required) // Item name (can be ref to InventoryItem ID)
  quantity: Number (required, min: 1)
  
  // Movement
  source: String (default: null) // For inbound
  destination: String (default: null) // For outbound/request
  
  // Status
  status: String (required, enum: ['completed', 'in-transit', 'pending', 'cancelled'])
  priority: String (default: null) // For 'request' type
  
  // Timestamps
  timestamp: Date (default: Date.now)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

---

### Donation Model

**Collection:** `donations`  
**File:** `backend/models/Inventory.js`

#### Schema
```javascript
{
  // Donor Information
  volunteerId: ObjectId (required, ref: 'User')
  
  // Donation Details
  itemName: String (required)
  category: String (required, enum: ['Medical', 'Food', 'Shelter', 'Equipment', 'Water'])
  quantity: Number (required, min: 1)
  location: String (required)
  
  // Status
  status: String (default: 'pending', enum: ['pending', 'approved', 'rejected', 'received'])
  approvedBy: String (default: null) // Admin username
  
  // Timestamps
  timestamp: Date (default: Date.now)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

#### Relationships
- **References:** `User` (volunteerId)

---

### Request Model

**Collection:** `requests`  
**File:** `backend/models/Inventory.js`

#### Schema
```javascript
{
  // Requester Information
  requesterId: ObjectId (required, ref: 'User')
  
  // Request Details
  itemName: String (required)
  category: String (required)
  quantity: Number (required, min: 1)
  location: String (required)
  priority: String (default: 'normal', enum: ['low', 'normal', 'high'])
  
  // Status
  status: String (default: 'pending', enum: ['pending', 'approved', 'rejected', 'delivered'])
  
  // Timestamps
  timestamp: Date (default: Date.now)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

#### Relationships
- **References:** `User` (requesterId)

---

## Routing Models

### RoutingHistory Model

**Collection:** `routinghistories`  
**File:** `backend/models/RoutingHistory.js`

#### Schema
```javascript
{
  // Identifiers
  routeId: String (required, unique) // Format: "ROUTE_<timestamp>"
  requestType: String (enum: ['emergency_response', 'evacuation', 'resource_delivery', 'reconnaissance', 'general'], default: 'emergency_response')
  
  // Origin & Destination
  origin: {
    lat: Number (required)
    lon: Number (required)
    name: String
    type: String // 'response_center', 'warehouse', 'hospital', etc.
  }
  destination: {
    lat: Number (required)
    lon: Number (required)
    name: String
    disasterZoneId: String
  }
  
  // Route Data
  routeData: {
    distance: Number // in kilometers
    duration: Number // in minutes
    waypoints: [{
      lat: Number
      lon: Number
      action: String
      eta: Date
    }]
    geometry: Mixed // GeoJSON or encoded polyline
  }
  
  // Routing Factors
  routingFactors: {
    traffic: Number
    weather: Number
    roadConditions: Number
    hazards: [String]
    disasterZones: [String]
    urgency: Number
  }
  
  // Alternatives
  alternatives: [{
    distance: Number
    duration: Number
    score: Number
    reason: String
  }]
  
  // Status
  status: String (enum: ['planned', 'active', 'rerouted', 'completed', 'cancelled', 'expired'], default: 'planned')
  severity: String (enum: ['low', 'medium', 'high', 'critical'])
  
  // Vehicle Tracking
  vehicle: {
    type: String
    id: String
    currentLocation: {
      lat: Number
      lon: Number
      timestamp: Date
    }
  }
  
  // Re-routing History
  reroutingHistory: [{
    timestamp: Date
    reason: String
    oldRoute: Mixed
    newRoute: Mixed
  }]
  
  // References
  userId: ObjectId (ref: 'User')
  emergencyId: ObjectId (ref: 'Emergency')
  
  // Expiration
  expiresAt: Date // TTL index
  
  // Metadata
  metadata: Mixed
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

#### Indexes
- `routeId` (unique)
- `status, createdAt` (compound, descending)
- `emergencyId`
- `userId, createdAt` (compound, descending)
- `expiresAt` (TTL index)

#### Relationships
- **References:** `User` (userId), `Emergency` (emergencyId)
- **Referenced by:** `AgentOutput.linkedEntities.routeId`

---

## Agent Models

### SeverityLog Model

**Collection:** `severitylogs`  
**File:** `backend/models/SeverityLog.js`

#### Schema
```javascript
{
  // Identifiers
  logId: String (required, unique) // Format: "SEV_<timestamp>"
  agentType: String (required, enum: ['nlp_agent', 'cv_agent', 'combined'])
  
  // Disaster Information
  disasterType: String (required, enum: ['fire', 'flood', 'earthquake', 'landslide', 'storm', 'cyclone', 'tsunami', 'unknown'])
  severity: String (required, enum: ['low', 'medium', 'high', 'critical'])
  severityScore: Number (required, min: 0, max: 1)
  confidence: Number (required, min: 0, max: 1)
  
  // Location
  location: {
    lat: Number (required)
    lon: Number (required)
    address: String
  }
  
  // Input Data
  inputData: {
    text: String
    imageUrl: String
    imageMetadata: Mixed
  }
  
  // Predictions
  predictions: {
    labels: [String]
    probabilities: [Number]
    features: Mixed
  }
  
  // Resource Allocation
  resourcesAllocated: {
    triggered: Boolean (default: false)
    items: [ObjectId] (ref: 'InventoryItem')
    quantities: Map<String, Number>
  }
  
  // Status
  status: String (enum: ['pending', 'processed', 'resources_allocated', 'completed', 'archived'], default: 'pending')
  
  // References
  userId: ObjectId (ref: 'User')
  notes: String
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

#### Indexes
- `logId` (unique)
- `agentType, createdAt` (compound, descending)
- `severity, status` (compound)
- `location.lat, location.lon` (geospatial)
- `disasterType, createdAt` (compound, descending)

#### Relationships
- **References:** `User` (userId), `InventoryItem[]` (resourcesAllocated.items)
- **Referenced by:** `AgentOutput.linkedEntities.severityLogId`

---

### AgentOutput Model

**Collection:** `agentoutputs`  
**File:** `backend/models/AgentOutput.js`

#### Schema
```javascript
{
  // Identifiers
  outputId: String (required, unique) // Format: "OUT_<timestamp>"
  agentId: String (required, enum: ['agent_1_nlp', 'agent_2_cv', 'agent_3_routing'])
  agentName: String (required)
  
  // Data
  inputData: Mixed
  outputData: Mixed
  processingTime: Number // in milliseconds
  confidence: Number (min: 0, max: 1)
  
  // Status
  status: String (enum: ['success', 'partial', 'failed', 'timeout'], default: 'success')
  errors: [String]
  warnings: [String]
  
  // Metadata
  metadata: {
    modelVersion: String
    apiVersion: String
    environment: String
    timestamp: Date
  }
  
  // Linked Entities
  linkedEntities: {
    emergencyId: ObjectId (ref: 'Emergency')
    severityLogId: ObjectId (ref: 'SeverityLog')
    disasterZoneId: ObjectId (ref: 'DisasterZone')
    routeId: ObjectId (ref: 'RoutingHistory')
  }
  
  // References
  userId: ObjectId (ref: 'User')
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

#### Indexes
- `outputId` (unique)
- `agentId, createdAt` (compound, descending)
- `linkedEntities.emergencyId`
- `status, createdAt` (compound, descending)

#### Relationships
- **References:** `User` (userId), `Emergency` (linkedEntities.emergencyId), `SeverityLog` (linkedEntities.severityLogId), `DisasterZone` (linkedEntities.disasterZoneId), `RoutingHistory` (linkedEntities.routeId)

---

## Disaster Model

**Collection:** `disasters`  
**File:** `backend/models/Disaster.js`

### Schema
```javascript
{
  // Disaster Information
  type: String (required) // "earthquake" or "fire"
  place: String
  magnitude: Number
  
  // Location
  coords: [Number] (required) // [lon, lat]
  
  // Timestamp
  time: Date (required)
}
```

### Relationships
- Used by Python disaster agent for real-time disaster data
- Not directly linked to other models (used for map visualization)

---

## Relationships Diagram

```
User
├──→ Emergency (userId, assignedTeam, dispatchDetails.dispatchedBy, timeline[].updatedBy)
├──→ Donation (volunteerId)
├──→ Request (requesterId)
├──→ RoutingHistory (userId)
├──→ SeverityLog (userId)
└──→ AgentOutput (userId)

Emergency
├──→ User (userId, assignedTeam, dispatchDetails.dispatchedBy, timeline[].updatedBy)
├──→ RoutingHistory (emergencyId)
└──→ AgentOutput (linkedEntities.emergencyId)

DisasterZone
└──→ AgentOutput (linkedEntities.disasterZoneId)

Location
└──→ InventoryItem (location)

InventoryItem
└──→ SeverityLog (resourcesAllocated.items[])

RoutingHistory
├──→ User (userId)
├──→ Emergency (emergencyId)
└──→ AgentOutput (linkedEntities.routeId)

SeverityLog
├──→ User (userId)
├──→ InventoryItem[] (resourcesAllocated.items)
└──→ AgentOutput (linkedEntities.severityLogId)

AgentOutput
├──→ User (userId)
├──→ Emergency (linkedEntities.emergencyId)
├──→ SeverityLog (linkedEntities.severityLogId)
├──→ DisasterZone (linkedEntities.disasterZoneId)
└──→ RoutingHistory (linkedEntities.routeId)
```

---

## Role-Based Access Control

### Roles
1. **admin** - Full system access
2. **branch manager** - Limited admin access (approvals, inventory management)
3. **volunteer** - Donation submission and tracking
4. **affected citizen** - Request submission and tracking

### Authentication Middleware
- **`protect`** - Verifies JWT token, attaches user to request
- **`authorize(...roles)`** - Checks if user role is in allowed roles list

### Route Access Matrix

#### Emergency Routes (`/api/emergency/*`)
| Route | Admin | Branch Manager | Volunteer | Affected Citizen |
|-------|-------|----------------|-----------|------------------|
| POST /request | ✅ | ✅ | ✅ | ✅ |
| GET /status/:id | ✅ | ✅ | ✅ | ✅ (own only) |
| GET /active | ✅ | ✅ | ❌ | ❌ |
| PUT /update/:id | ✅ | ✅ | ❌ | ❌ |
| POST /dispatch/:id | ✅ | ❌ | ❌ | ❌ |
| GET /dispatch-status/:id | ✅ | ✅ | ✅ | ✅ |
| GET /active-dispatches | ✅ | ✅ | ❌ | ❌ |
| PUT /update-status/:id | ✅ | ✅ | ❌ | ❌ |
| PUT /complete/:id | ✅ | ✅ | ❌ | ❌ |
| GET /completed | ✅ | ✅ | ❌ | ❌ |
| DELETE /:id | ✅ | ❌ | ❌ | ❌ |
| POST /analyze-image | ✅ | ✅ | ✅ | ✅ |
| POST /reroute/:id | ✅ | ✅ | ❌ | ❌ |
| GET /analytics | ✅ | ✅ | ❌ | ❌ |

**Note:** All emergency routes require `protect` middleware (authenticated users only)

---

#### Disaster Routes (`/api/disasters/*`)
| Route | Admin | Branch Manager | Volunteer | Affected Citizen |
|-------|-------|----------------|-----------|------------------|
| GET /zones | ✅ | ✅ | ✅ | ✅ |
| POST /zones | ✅ | ✅ | ❌ | ❌ |
| PUT /zones/:id | ✅ | ✅ | ❌ | ❌ |
| DELETE /zones/:id | ✅ | ❌ | ❌ | ❌ |
| GET /analytics | ✅ | ✅ | ✅ | ✅ |
| GET /zones/:id/emergencies | ✅ | ✅ | ✅ | ✅ |

**Note:** All disaster routes require `protect` middleware

---

#### Inventory Routes (`/api/inventory/*`)
| Route | Admin | Branch Manager | Volunteer | Affected Citizen |
|-------|-------|----------------|-----------|------------------|
| GET /items | ✅ | ✅ | ✅ | ✅ |
| POST /items | ✅ | ✅ | ❌ | ❌ |
| PUT /items/:id | ✅ | ✅ | ❌ | ❌ |
| DELETE /items/:id | ✅ | ❌ | ❌ | ❌ |
| GET /locations | ✅ | ✅ | ✅ | ✅ |
| POST /locations | ✅ | ✅ | ❌ | ❌ |
| GET /transactions | ✅ | ✅ | ✅ | ✅ |
| POST /transactions | ✅ | ✅ | ❌ | ❌ |

**Note:** All inventory routes require `protect` middleware

---

#### Donation Routes (`/api/donations`)
| Route | Admin | Branch Manager | Volunteer | Affected Citizen |
|-------|-------|----------------|-----------|------------------|
| GET /donations | ✅ | ✅ | ✅ (own only) | ❌ |
| POST /donations | ✅ | ✅ | ✅ | ❌ |
| PUT /donations/:id | ✅ | ✅ | ❌ | ❌ |

**Implementation:** `protect, authorize('volunteer', 'admin')` for GET/POST, `protect, authorize('admin', 'branch manager')` for PUT

---

#### Request Routes (`/api/requests`)
| Route | Admin | Branch Manager | Volunteer | Affected Citizen |
|-------|-------|----------------|-----------|------------------|
| GET /requests | ✅ | ✅ | ❌ | ✅ (own only) |
| POST /requests | ✅ | ✅ | ❌ | ✅ |
| PUT /requests/:id | ✅ | ✅ | ❌ | ❌ |

**Implementation:** `protect, authorize('affected citizen', 'admin')` for GET/POST, `protect, authorize('admin', 'branch manager')` for PUT

---

#### Agent Routes (`/api/agents/*`)
| Route | Admin | Branch Manager | Volunteer | Affected Citizen |
|-------|-------|----------------|-----------|------------------|
| All CRUD operations | ✅ | ✅ | ❌ | ❌ |
| GET /analytics/* | ✅ | ✅ | ✅ | ✅ |
| POST /calculate-route | ✅ | ✅ | ✅ | ✅ |

**Note:** All agent routes require `protect` middleware. CRUD operations typically restricted to admin/branch manager.

---

#### Authentication Routes
| Route | Access |
|-------|--------|
| POST /api/register | Public (no auth required) |
| POST /api/login | Public (no auth required) |

---

#### Disaster Predictions
| Route | Admin | Branch Manager | Volunteer | Affected Citizen |
|-------|-------|----------------|-----------|------------------|
| GET /api/disaster-predictions | ✅ | ✅ | ✅ | ✅ |

**Note:** Requires `protect` middleware

---

## Field-Level Access Control

### Emergency Model
- **userId** - Only owner or admin can view full details
- **assignedTeam** - Only admin/branch manager can assign
- **dispatchDetails** - Only admin can dispatch
- **timeline** - All authenticated users can view, only admin/branch manager can update

### InventoryItem Model
- **cost** - Only admin/branch manager can view/edit
- **supplier** - Only admin/branch manager can view/edit
- **currentStock** - All authenticated users can view

### Donation Model
- **volunteerId** - Volunteers can only see their own donations
- **approvedBy** - Only admin/branch manager can approve

### Request Model
- **requesterId** - Recipients can only see their own requests
- **status** - Only admin/branch manager can approve/reject

---

## Database Indexes Summary

### Performance Indexes
- **Geospatial:** `Emergency.location`, `DisasterZone.location.center`, `SeverityLog.location`, `Location.coordinates`
- **Compound:** Status + timestamp combinations for efficient filtering
- **Unique:** All `*Id` fields (emergencyId, zoneId, routeId, logId, outputId, username)
- **TTL:** `RoutingHistory.expiresAt` for automatic cleanup

### Query Optimization
- Most queries filter by `status` + `createdAt` (descending)
- Geospatial queries use 2dsphere indexes
- User-specific queries use `userId` + `createdAt` indexes

---

## Data Validation Rules

### Required Fields
- All models have required fields marked in schema
- ObjectId references must exist in referenced collection
- Enum values are strictly enforced

### Business Rules
- **Emergency status flow:** received → analyzing → dispatched → en_route → delivered → completed
- **Donation status flow:** pending → approved/rejected → received (if approved)
- **Request status flow:** pending → approved/rejected → delivered (if approved)
- **InventoryItem status:** Auto-calculated based on `currentStock` vs `minThreshold`

### Constraints
- `currentStock` cannot be negative
- `severityScore` and `confidence` must be between 0 and 1
- `quantity` fields must be >= 1
- Password minimum length: 6 characters


