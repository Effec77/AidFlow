# 🎨 AidFlow AI - Frontend

> React 18 Frontend Application

---

## 📁 Structure

```
frontend/src/
├── components/          # React Components
│   ├── 🏠 Core
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Hero.jsx
│   │   └── About.jsx
│   │
│   ├── 🚨 Emergency
│   │   ├── EmergencyRequest.jsx
│   │   ├── EmergencyDashboard.jsx
│   │   ├── DispatchControl.jsx
│   │   └── DispatchTracker.jsx
│   │
│   ├── 📦 Inventory
│   │   ├── InventoryPage.jsx
│   │   └── InventoryIntegration.jsx
│   │
│   └── 🗺️ Routing
│       └── RoutingVisualization.jsx
│
├── css/                # Stylesheets
│   ├── style.css       # Global + Theme
│   ├── Emergency.css
│   ├── DispatchControl.css
│   └── [component styles]
│
├── App.js              # Main App + Routes
└── index.js            # Entry Point
```

---

## 🚀 Setup

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm start
```

Access at: http://localhost:3000

### Build for Production
```bash
npm run build
```

---

## 🎯 Main Pages

### Home (/)
Landing page with hero, services, team

### Emergency (/emergency)
Submit emergency requests

### Emergency Dashboard (/emergency-dashboard)
Admin view of all emergencies

### Dispatch Tracker (/dispatch-tracker)
Real-time tracking map

### Routing (/routing)
Smart routing visualization

### Inventory (/inventory-live)
Live inventory management

---

## 🎨 Styling

### Theme System
- Dark mode (default)
- Light mode toggle
- CSS variables in `style.css`

### Component Styles
Each component has dedicated CSS file

### Responsive Design
Mobile-first approach
- Desktop: Full layout
- Tablet: Adapted layout
- Mobile: Stacked layout

---

## 🗺️ Key Components

### DispatchTracker.jsx
**Features:**
- Interactive Leaflet map
- Real-time updates (10s)
- Multiple dispatch tracking
- Progress bars
- ETA calculations

**Dependencies:**
- react-leaflet
- leaflet
- axios

### EmergencyRequest.jsx
**Features:**
- Location detection
- AI-powered analysis
- Form validation
- Success confirmation

### DispatchControl.jsx
**Features:**
- One-click dispatch
- Progress tracking
- Resource allocation display
- Error handling

---

## 📦 Dependencies

### Core
- react: ^18.2.0
- react-router-dom: ^6.x
- axios: ^1.x

### UI
- lucide-react: Icons
- react-leaflet: Maps
- leaflet: Map library

### Styling
- tailwindcss: Utility CSS
- Custom CSS modules

---

## 🔧 Configuration

### API Endpoint
Update in components:
```javascript
const API_URL = 'http://localhost:5000';
```

### Theme
Toggle in Header component
Stored in localStorage

---

## 🎯 Routes

```javascript
/                       # Home
/emergency              # Submit Emergency
/emergency-dashboard    # Admin Dashboard
/dispatch-tracker       # Live Tracking
/routing                # Smart Routing
/inventory-live         # Inventory
/login                  # Login
/register               # Register
```

---

## 📱 Responsive Breakpoints

```css
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px
```

---

## 🎨 Color Scheme

### Dark Mode (Default)
```css
--primary-bg: #0F1419
--text-color: #F0F4F8
--accent-color: #FFD54F
```

### Light Mode
```css
--primary-bg: #F0F4F8
--text-color: #2D3748
--accent-color: #3182CE
```

---

## 🚀 Performance

- Code splitting
- Lazy loading
- Optimized images
- Memoized components

---

## 🧪 Testing

```bash
npm test
```

---

**Version:** 1.0.0
**Status:** Production Ready ✅
