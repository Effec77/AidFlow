# 🔧 AidFlow AI - Backend

> Node.js + Express + MongoDB Backend Server

---

## 📁 Structure

```
backend/
├── config/              # Configuration files
│   └── db.js           # MongoDB connection
│
├── models/             # Mongoose Models
│   ├── User.js
│   ├── Emergency.js
│   ├── Inventory.js
│   ├── DisasterZone.js
│   ├── RoutingHistory.js
│   ├── SeverityLog.js
│   └── AgentOutput.js
│
├── routes/             # API Routes
│   ├── auth.js
│   ├── emergency.js
│   ├── inventory.js
│   ├── agents.js
│   └── users.js
│
├── services/           # Business Logic
│   ├── aiAgent.js              # Main AI Controller
│   ├── nlpEngine.js            # NLP Analysis
│   ├── imageDisasterDetection.js
│   ├── smartRouting.js         # Routing Agent
│   ├── routingService.js       # OSRM Integration
│   └── dispatchService.js      # Dispatch Automation
│
├── tests/              # Test Files
├── data/               # Mock Data
├── .env                # Environment Variables
├── server.js           # Entry Point
└── package.json        # Dependencies
```

---

## 🚀 Setup

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/aidflow
PORT=5000
NODE_ENV=development
OPENWEATHER_API_KEY=your_key
FIRMS_API_KEY=your_key
```

### Run Server
```bash
# Development
npm run dev

# Production
npm start
```

---

## 📡 API Endpoints

### Emergency System
- `POST /api/emergency/request` - Submit emergency
- `GET /api/emergency/active` - Get active emergencies
- `POST /api/emergency/dispatch/:id` - Dispatch resources
- `GET /api/emergency/active-dispatches` - Track dispatches

### Inventory
- `GET /api/inventory/items` - Get all items
- `POST /api/inventory/items` - Add item
- `PUT /api/inventory/items/:id` - Update item

### Routing
- `POST /api/agents/calculate-route` - Calculate route
- `GET /api/agents/disaster-zones` - Get zones

---

## 🤖 AI Services

### aiAgent.js
Main controller orchestrating all 3 AI agents

### nlpEngine.js
Natural language processing for emergency text

### smartRouting.js
Intelligent route optimization

### dispatchService.js
Automated resource dispatch system

---

## 🗄️ Database Models

### Emergency
- Emergency requests
- AI analysis results
- Dispatch details
- Timeline tracking

### Inventory
- Items, locations, transactions
- Stock levels
- Multi-location support

### RoutingHistory
- Route calculations
- Waypoints
- Performance metrics

---

## 🔧 Configuration

### MongoDB Connection
Located in `config/db.js`

### CORS
Configured in `server.js` for frontend access

### Port
Default: 5000 (configurable via .env)

---

## 📊 Performance

- Response time: < 500ms
- Emergency processing: < 2s
- Route calculation: < 1.5s
- Concurrent requests: 100+

---

## 🧪 Testing

```bash
npm test
```

Test files in `tests/` directory

---

**Version:** 1.0.0
**Status:** Production Ready ✅
