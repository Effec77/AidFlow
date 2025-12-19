# AI Agents Documentation

## Overview
AidFlow uses 3 specialized AI agents for emergency response, disaster detection, and route optimization.

---

## Agent 1: Emergency AI Agent (NLP & Analysis)
**Location:** `backend/services/aiAgent.js`  
**Class:** `EmergencyAIAgent`

### Purpose
Main orchestrator for emergency requests. Analyzes text, determines disaster type, allocates resources, and coordinates other agents.

### Capabilities
1. **NLP Sentiment Analysis** (via NLPEngine)
   - Sentiment detection (positive/negative/neutral)
   - Emotion recognition (panic, fear, pain, desperation, calm)
   - Urgency scoring (critical/high/medium/low)
   - Named Entity Recognition (locations, persons, organizations)

2. **Disaster Type Detection**
   - Analyzes user message keywords
   - Checks weather conditions (OpenWeather API)
   - Checks NASA FIRMS fire data
   - Determines disaster type (fire, flood, earthquake, landslide, storm)

3. **Resource Planning**
   - Maps disaster type to required resources
   - Adjusts quantities based on urgency
   - Creates resource allocation plan

4. **Satellite Intelligence**
   - Weather data gathering
   - Fire hotspot detection
   - Infrastructure analysis (OpenStreetMap)
   - Environmental risk assessment

5. **Route Coordination**
   - Calls Agent 3 for routing
   - Integrates routing with resource allocation

### Integration Points
- **Used by:** `/api/emergency/request`
- **Uses:** `NLPEngine`, `SmartRoutingAgent`, `ImageDisasterDetectionAgent`
- **Creates:** `Emergency` model with full AI analysis

### Output Structure
```javascript
{
  emergencyId: "EMG_...",
  analysis: {
    disaster: { type, confidence, priority },
    nlp: { sentiment, emotion, urgency },
    severity: "critical|high|medium|low"
  },
  response: {
    resources: { immediate, secondary, quantities },
    routing: { ... }, // From Agent 3
    estimatedArrival: "...",
    priority: "..."
  }
}
```

---

## Agent 2: Image Disaster Detection Agent
**Location:** `backend/services/imageDisasterDetection.js`  
**Class:** `ImageDisasterDetectionAgent`

### Purpose
Detects disasters from drone/satellite images using deep learning and NASA satellite data.

### Capabilities
1. **EfficientNet B3 Model**
   - Deep learning image classification
   - 8 disaster classes: fire, flood, earthquake_damage, landslide, storm_damage, building_collapse, infrastructure_damage, normal
   - Probability-based predictions

2. **NASA Satellite Integration**
   - **NASA FIRMS:** Real-time fire detection
   - **NASA EONET:** Natural disaster events
   - **MODIS:** Satellite imagery data

3. **Combined Analysis**
   - Corroborates model predictions with NASA data
   - Increases confidence when multiple sources agree
   - Severity calculation from confidence scores

### Integration Points
- **Used by:** `/api/emergency/analyze-image`
- **Can be called by:** Agent 1 for enhanced analysis
- **Returns:** Detection results with labels and confidence

### Output Structure
```javascript
{
  agentId: "agent_2_image_detection",
  modelPrediction: {
    primaryDisaster: { label, probability, class },
    topPredictions: [...],
    confidence: 0.85,
    severity: "high"
  },
  nasaData: {
    fires: [...],
    events: [...]
  },
  combinedAnalysis: {
    disasterType: "fire",
    confidence: 0.92,
    severity: "high",
    sources: ["efficientnet_b3", "nasa_firms"]
  }
}
```

---

## Agent 3: Smart Routing Agent
**Location:** `backend/services/smartRouting.js`  
**Class:** `SmartRoutingAgent`

### Purpose
Calculates optimal routes for emergency response with real-time adjustments.

### Capabilities
1. **Route Calculation**
   - Uses OSRM (Open Source Routing Machine)
   - Finds nearest response centers
   - Calculates multiple route options

2. **AI Route Optimization**
   - Traffic estimation (time-of-day based)
   - Weather impact assessment
   - Road condition analysis
   - Terrain assessment
   - Hazard identification

3. **Time Adjustment**
   - Base time from distance
   - AI-adjusted time based on factors
   - ETA calculation with confidence

4. **Route Scoring**
   - Multi-factor scoring system
   - Selects optimal route
   - Generates alternative routes

5. **Real-time Re-routing**
   - Monitors route conditions
   - Detects significant changes
   - Suggests alternative routes

### Integration Points
- **Used by:** `/api/agents/calculate-route`, `/api/emergency/reroute/:emergencyId`
- **Called by:** Agent 1, `DispatchService`
- **Stores:** Route history in `RoutingHistory` model

### Output Structure
```javascript
{
  agentId: "agent_3_smart_routing",
  routes: [{
    centerId: "...",
    distance: 12.5, // km
    baseTime: 25, // minutes
    adjustedTime: 32, // AI-adjusted
    eta: "2024-01-01T12:30:00Z",
    waypoints: [...],
    factors: {
      traffic: 1.5,
      weather: 1.0,
      roadConditions: 1.0
    },
    score: 85
  }],
  optimalRoute: { ... },
  alternatives: [ ... ]
}
```

---

## Agent Interconnections

```
Emergency Request
    ↓
Agent 1 (EmergencyAIAgent)
    ├──→ NLPEngine (sentiment/urgency)
    ├──→ Satellite Intelligence
    ├──→ Disaster Type Detection
    ├──→ Resource Planning
    └──→ Agent 3 (routing)
         └──→ OSRM + AI factors
    └──→ Agent 2 (optional image analysis)
         └──→ EfficientNet + NASA
```

---

## Python Disaster Agent
**Location:** `agents/disaster_agent.py`

### Purpose
Background service that fetches real-time disaster data from external APIs.

### Data Sources
1. **USGS Earthquake API**
   - Fetches daily earthquake data
   - Filters for India region
   - Normalizes to standard format

2. **NASA FIRMS**
   - Fetches 24-hour fire data
   - Filters for India region
   - Normalizes fire events

### Process
- Runs hourly (configurable)
- Upserts events to MongoDB
- Prevents duplicates using coordinates + timestamp

### Integration
- Updates `Disaster` model in MongoDB
- Used by frontend for live disaster map
- Can trigger disaster zone creation

---

## Agent Output Models

### SeverityLog
Tracks severity assessments from agents.

### RoutingHistory
Stores calculated routes for analysis and optimization.

### AgentOutput
General model for storing agent analysis results.

---

## Agent Configuration

### Environment Variables
- `HUGGINGFACE_API_KEY` - For NLP models (Agent 1)
- `OPENWEATHER_API_KEY` - Weather data (Agent 1)
- `FIRMS_API_KEY` - NASA fire data (Agent 2)
- `EFFICIENTNET_API_URL` - Image model endpoint (Agent 2)
- `GRAPHHOPPER_API_KEY` - Alternative routing (Agent 3)

### Fallback Modes
All agents have fallback rule-based systems when AI services are unavailable, ensuring system reliability.

