# 🌍 Live Disasters Dashboard - Feature Documentation

## Overview
The Live Disasters Dashboard is a comprehensive real-time disaster monitoring and management system that integrates seamlessly with your existing Emergency Response, Dispatch Tracking, and Inventory Management systems.

## 🎯 Key Features

### 1. **Real-Time Disaster Zone Monitoring**
- Interactive map showing all active disaster zones
- Color-coded severity levels (critical, high, medium, low)
- Automatic refresh every 30 seconds
- Click-to-select disaster zones for detailed information

### 2. **Disaster Zone Management**
- Create new disaster zones with:
  - Name and description
  - Disaster type (flood, fire, earthquake, storm, landslide, drought, cyclone)
  - Severity level
  - Geographic location (lat/lon)
  - Affected radius
  - Estimated affected population
- Update existing zones
- Mark zones as resolved

### 3. **Emergency Integration** 🚨
- **One-Click Emergency Creation**: Create emergency requests directly from disaster zones
- Auto-fills location, disaster type, and severity
- Triggers your existing AI analysis pipeline
- Seamlessly redirects to Emergency Dashboard

### 4. **Inventory Impact Analysis** 📦
- Shows required resources for each disaster type
- Real-time inventory stock levels
- Color-coded resource availability:
  - 🟢 Adequate: Sufficient stock
  - 🟡 Low: Running low
  - 🔴 Critical: Very low stock
  - ⚫ Unknown: Not in inventory

### 5. **Analytics Dashboard** 📊
- Active disaster zones count
- Resolved zones count
- Total affected population
- Recent disasters (this week)
- Breakdown by type and severity

### 6. **Navigation Integration**
- Quick links to:
  - Emergency Dashboard
  - Dispatch Tracker
- Seamless workflow between systems

## 🔗 System Integration

### Integration with Emergency System
```javascript
// When "Create Emergency" is clicked on a disaster zone:
POST /api/emergency/request
{
  lat: disaster.location.lat,
  lon: disaster.location.lon,
  message: "Emergency in [disaster name]. [type] disaster with [severity] severity.",
  userId: "disaster_system",
  address: disaster.location.address
}
```

### Integration with Inventory System
- Automatically checks inventory for disaster-specific resources
- Shows real-time stock levels
- Resource recommendations based on disaster type:
  - **Flood**: Water Pumps, Boats, Life Jackets, Medical Kit
  - **Fire**: Fire Extinguishers, Water Tanks, Protective Gear
  - **Earthquake**: Search Equipment, Medical Kit, Shelter, Food
  - **Storm**: Shelter Materials, Medical Kit, Food, Water
  - **Landslide**: Search Equipment, Medical Kit, Heavy Machinery
  - **Drought**: Water Tanks, Food, Medical Kit
  - **Cyclone**: Shelter Materials, Medical Kit, Communication Equipment

### Integration with Dispatch System
- Disaster zones can be used to avoid routing through affected areas
- Dispatch tracker shows active dispatches in relation to disaster zones
- Coordinated resource allocation

## 📡 API Endpoints

### Disaster Zones
```
GET    /api/disasters/zones              // Get all disaster zones
POST   /api/disasters/zones              // Create new zone
PUT    /api/disasters/zones/:zoneId      // Update zone
DELETE /api/disasters/zones/:zoneId      // Resolve zone
```

### Analytics
```
GET    /api/disasters/analytics          // Get statistics
```

### Emergency Integration
```
GET    /api/disasters/zones/:zoneId/emergencies  // Get linked emergencies
```

## 🎨 User Interface

### Main Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  🌍 Live Disasters Dashboard                            │
│  [Emergency Dashboard] [Dispatch Tracker] [+ Create]    │
├─────────────────────────────────────────────────────────┤
│  📊 Analytics Cards                                     │
│  [Active: X] [Resolved: Y] [Affected: Z] [This Week: W]│
├──────────────┬──────────────────────┬───────────────────┤
│              │                      │                   │
│  Disaster    │    Interactive       │   Detail Panel    │
│  List        │    Map View          │   (Selected)      │
│              │                      │                   │
│  - Zone 1    │    🗺️ Map with       │   📋 Info         │
│  - Zone 2    │    markers &         │   📦 Resources    │
│  - Zone 3    │    circles           │   ⚡ Actions      │
│              │                      │   📅 Timeline     │
└──────────────┴──────────────────────┴───────────────────┘
```

### Color Coding
- **Critical**: Red (#DC2626)
- **High**: Orange (#EA580C)
- **Medium**: Yellow (#D97706)
- **Low**: Green (#65A30D)

## 🔄 Complete Workflow Example

### Scenario: Flood Disaster Response

1. **Disaster Detected** 🌊
   ```
   Admin creates disaster zone:
   - Name: "Downtown Flood Zone"
   - Type: Flood
   - Severity: Critical
   - Location: 30.7171, 76.8537
   - Radius: 2km
   - Affected: 5000 people
   ```

2. **Emergency Created** 🚨
   ```
   Click "Create Emergency" →
   Emergency EMG_1234567890 created
   AI Analysis triggered
   Resources recommended:
   - Water Pumps (5 units)
   - Boats (2 units)
   - Life Jackets (50 units)
   - Medical Kits (10 units)
   ```

3. **Inventory Checked** 📦
   ```
   System shows:
   ✅ Water Pumps: 8 available (adequate)
   ✅ Boats: 3 available (adequate)
   ⚠️ Life Jackets: 20 available (low)
   ✅ Medical Kits: 15 available (adequate)
   ```

4. **Resources Dispatched** 🚗
   ```
   From Emergency Dashboard:
   - Dispatch resources
   - Route calculated (avoiding flood zone)
   - Real-time tracking begins
   ```

5. **Disaster Resolved** ✅
   ```
   Mark disaster zone as resolved
   Update timeline
   Archive for historical data
   ```

## 📱 Responsive Design
- Desktop: 3-column layout (list, map, details)
- Tablet: 2-column layout (list + map, details overlay)
- Mobile: Single column with stacked views

## 🚀 Access
Navigate to: **http://localhost:3000/live-disasters**

Or use the navigation menu: **Features → 🌍 Live Disasters**

## 🔧 Technical Stack

### Frontend
- React with Hooks (useState, useEffect)
- React Leaflet for interactive maps
- Axios for API calls
- Lucide React for icons
- CSS with animations and transitions

### Backend
- Express.js routes
- MongoDB with Mongoose
- Integration with existing Emergency and Inventory systems

### Database Model
```javascript
DisasterZone {
  zoneId: String (unique)
  name: String
  disasterType: Enum
  severity: Enum
  location: {
    center: { lat, lon }
    radius: Number (km)
    affectedArea: Number (sq km)
  }
  affectedPopulation: {
    estimated: Number
  }
  status: Enum (active, resolved, etc.)
  alerts: [{ level, message, timestamp }]
  metadata: Mixed
}
```

## 🎯 Benefits

1. **Centralized Monitoring**: Single dashboard for all active disasters
2. **Quick Response**: One-click emergency creation
3. **Resource Awareness**: Real-time inventory impact analysis
4. **Coordinated Action**: Seamless integration with dispatch and emergency systems
5. **Data-Driven**: Analytics for better decision making
6. **Historical Tracking**: Timeline and resolution tracking

## 🔮 Future Enhancements (Suggested)

1. **Satellite Integration**: Real-time satellite imagery
2. **Weather API**: Live weather data for disaster zones
3. **Heat Maps**: Intensity visualization
4. **Evacuation Routes**: Automated safe route calculation
5. **Multi-Language**: Support for regional languages
6. **Mobile App**: Native mobile application
7. **Push Notifications**: Real-time alerts
8. **Social Media Integration**: Crowdsourced disaster reports

## 📝 Notes

- The system uses the existing DisasterZone model from your database
- All disaster zones are stored persistently in MongoDB
- The dashboard auto-refreshes every 30 seconds
- Map markers are clickable for quick information
- The system is fully integrated with your existing emergency response workflow

---

**Built with ❤️ for AidFlow - Disaster Relief Management System**
