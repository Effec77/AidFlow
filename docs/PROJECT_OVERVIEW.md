# AidFlow Project Overview

## Quick Reference

AidFlow is an AI-powered disaster relief management system that automates emergency response, resource allocation, and dispatch coordination.

---

## Documentation Index

1. **[API_ROUTES.md](./API_ROUTES.md)** - Complete API endpoint documentation
2. **[FEATURES.md](./FEATURES.md)** - Feature descriptions and user flows
3. **[AI_AGENTS.md](./AI_AGENTS.md)** - AI agent capabilities and integration
4. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - System design and interrelations

---

## System Components

### Frontend (React)
- Emergency request submission
- Real-time dispatch tracking
- Inventory management dashboards
- Live disaster visualization
- Route visualization

### Backend (Node.js/Express)
- RESTful API endpoints
- MongoDB database
- AI agent services
- Dispatch automation

### AI Agents
- **Agent 1:** Emergency AI Agent (NLP + orchestration)
- **Agent 2:** Image Disaster Detection (EfficientNet + NASA)
- **Agent 3:** Smart Routing (OSRM + AI optimization)
- **Python Agent:** Real-time disaster data fetcher

---

## Key Workflows

### Emergency Response
```
Emergency Request → AI Analysis → Resource Allocation → Route Calculation → Dispatch → Tracking
```

### Inventory Management
```
Donations (Volunteers) → Approval → Inventory Stock
Requests (Recipients) → Approval → Inventory Deduction
```

### Disaster Tracking
```
Python Agent → External APIs → MongoDB → Frontend Map
```

---

## Technology Stack

- **Frontend:** React, React Router, CSS
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **AI/ML:** Hugging Face Transformers, EfficientNet B3, Custom NLP
- **APIs:** OSRM, OpenWeather, NASA FIRMS/EONET, OpenStreetMap
- **Python:** USGS API, NASA FIRMS API

---

## Main Models

- `Emergency` - Emergency requests with AI analysis
- `DisasterZone` - Active disaster zones
- `InventoryItem` - Stock items at locations
- `Donation` - Volunteer donations
- `Request` - Recipient requests
- `User` - System users (admin, volunteer, recipient)
- `RoutingHistory` - Route calculations
- `SeverityLog` - Agent severity assessments

---

## Quick Start

1. **Backend:** `cd backend && npm install && npm start`
2. **Frontend:** `cd frontend && npm install && npm start`
3. **Python Agent:** `cd agents && pip install -r requirements.txt && python disaster_agent.py`

---

## Key Features Summary

✅ AI-powered emergency analysis  
✅ One-click automated dispatch  
✅ Real-time inventory management  
✅ Smart routing with re-routing  
✅ Image-based disaster detection  
✅ Live disaster zone tracking  
✅ Role-based dashboards  
✅ Analytics and reporting  

---

For detailed information, see the individual documentation files.

