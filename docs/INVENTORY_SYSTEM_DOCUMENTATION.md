# 📦 Inventory Management System - Complete Documentation

## Overview
The Inventory Management System is a comprehensive supply chain solution for disaster relief operations, enabling real-time tracking, management, and distribution of emergency supplies.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  INVENTORY SYSTEM                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (React)          Backend (Express)            │
│  ├── InventoryPage         ├── Routes                   │
│  ├── VolunteerPage         ├── Models                   │
│  └── RecipientPage         └── Controllers              │
│                                                          │
│  Database (MongoDB)                                      │
│  ├── InventoryItems                                     │
│  ├── Locations                                          │
│  ├── Transactions                                       │
│  ├── Donations                                          │
│  └── Requests                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Database Models

### 1. InventoryItem Model 📦

**Purpose:** Core inventory tracking

**Schema:**
```javascript
{
  name: String,              // Item name (e.g., "Medical Masks")
  category: Enum,            // Medical, Food, Shelter, Equipment, Water
  currentStock: Number,      // Current quantity available
  minThreshold: Number,      // Minimum stock level (triggers alerts)
  maxCapacity: Number,       // Maximum storage capacity
  unit: String,              // Unit of measurement (boxes, kg, liters)
  location: String,          // Storage location
  lastUpdated: Date,         // Last modification timestamp
  status: Enum,              // critical, low, adequate
  cost: Number,              // Cost per unit
  supplier: String,          // Supplier name
  timestamps: true           // createdAt, updatedAt
}
```

**Status Logic:**
```javascript
if (currentStock <= 0) status = 'critical'
else if (currentStock < minThreshold) status = 'low'
else status = 'adequate'
```

**Example:**
```json
{
  "name": "Medical Masks",
  "category": "Medical",
  "currentStock": 500,
  "minThreshold": 100,
  "maxCapacity": 2000,
  "unit": "boxes",
  "location": "Warehouse A",
  "status": "adequate",
  "cost": 25,
  "supplier": "MedSupply Co."
}
```

---

### 2. Location Model 📍

**Purpose:** Track storage facilities

**Schema:**
```javascript
{
  name: String,              // Location name (unique)
  type: String,              // Warehouse, Distribution Center, etc.
  capacity: String,          // Storage capacity description
  timestamps: true
}
```

**Example:**
```json
{
  "name": "Central Warehouse",
  "type": "Main Storage",
  "capacity": "10,000 cubic meters"
}
```

---

### 3. Transaction Model 📊

**Purpose:** Track inventory movements

**Schema:**
```javascript
{
  type: Enum,                // inbound, outbound, request
  item: String,              // Item name/ID
  quantity: Number,          // Amount transferred
  source: String,            // Origin location (for inbound)
  destination: String,       // Target location (for outbound)
  timestamp: Date,           // Transaction time
  status: Enum,              // completed, in-transit, pending, cancelled
  priority: String,          // For requests (low, normal, high)
  timestamps: true
}
```

**Transaction Types:**
- **Inbound:** Receiving supplies (donations, purchases)
- **Outbound:** Sending supplies to disaster zones
- **Request:** Emergency resource requests

**Example:**
```json
{
  "type": "outbound",
  "item": "Medical Masks",
  "quantity": 50,
  "source": "Central Warehouse",
  "destination": "Flood Zone A",
  "status": "in-transit",
  "priority": "high"
}
```

---

### 4. Donation Model 🎁

**Purpose:** Volunteer contributions

**Schema:**
```javascript
{
  volunteerId: ObjectId,     // Reference to User
  itemName: String,          // Donated item
  category: Enum,            // Medical, Food, Shelter, Equipment, Water
  quantity: Number,          // Amount donated
  location: String,          // Drop-off location
  status: Enum,              // pending, approved, rejected, received
  approvedBy: String,        // Admin who approved
  timestamp: Date,
  timestamps: true
}
```

**Workflow:**
```
Volunteer submits donation
    ↓
Admin reviews
    ↓
Approved → Added to inventory
Rejected → Notification sent
```

**Example:**
```json
{
  "volunteerId": "507f1f77bcf86cd799439011",
  "itemName": "Bottled Water",
  "category": "Water",
  "quantity": 100,
  "location": "Community Center",
  "status": "approved",
  "approvedBy": "admin@aidflow.com"
}
```

---

### 5. Request Model 📋

**Purpose:** Recipient supply requests

**Schema:**
```javascript
{
  requesterId: ObjectId,     // Reference to User
  itemName: String,          // Requested item
  category: String,          // Item category
  quantity: Number,          // Amount needed
  location: String,          // Delivery location
  status: Enum,              // pending, approved, rejected, delivered
  priority: Enum,            // low, normal, high
  timestamp: Date,
  timestamps: true
}
```

**Workflow:**
```
Recipient submits request
    ↓
System checks inventory
    ↓
Sufficient stock → Auto-approve
Insufficient stock → Pending review
    ↓
Approved → Deduct from inventory
Delivered → Mark complete
```

**Example:**
```json
{
  "requesterId": "507f1f77bcf86cd799439012",
  "itemName": "Emergency Food Kits",
  "category": "Food",
  "quantity": 20,
  "location": "Shelter B",
  "status": "approved",
  "priority": "high"
}
```

---

## API Endpoints

### Inventory Items

**GET /api/inventory/items**
- Get all inventory items
- Query params: `category`, `location`, `status`
- Returns: Array of items

**POST /api/inventory/items**
- Create new inventory item
- Body: Item object
- Returns: Created item

**PUT /api/inventory/items/:id**
- Update inventory item
- Body: Updated fields
- Returns: Updated item

**DELETE /api/inventory/items/:id**
- Delete inventory item
- Returns: Success message

---

### Locations

**GET /api/inventory/locations**
- Get all storage locations
- Returns: Array of locations

**POST /api/inventory/locations**
- Create new location
- Body: Location object
- Returns: Created location

---

### Transactions

**GET /api/inventory/transactions**
- Get all transactions
- Query params: `type`, `status`
- Returns: Array of transactions

**POST /api/inventory/transactions**
- Create new transaction
- Body: Transaction object
- Returns: Created transaction

---

### Donations

**GET /api/donations**
- Get all donations
- Query params: `status`, `volunteerId`
- Returns: Array of donations

**POST /api/donations**
- Submit new donation
- Body: `{ itemName, category, quantity, location }`
- Returns: Created donation

**PUT /api/donations/:id**
- Update donation status
- Body: `{ status, approvedBy }`
- Auto-adds to inventory when approved
- Returns: Updated donation

---

### Requests

**GET /api/requests**
- Get all requests
- Query params: `status`, `requesterId`
- Returns: Array of requests

**POST /api/requests**
- Submit new request
- Body: `{ itemName, category, quantity, location, priority }`
- Returns: Created request

**PUT /api/requests/:id**
- Update request status
- Body: `{ status }`
- Auto-deducts from inventory when approved
- Returns: Updated request

---

## Frontend Components

### 1. InventoryPage (Admin) 👨‍💼

**Features:**
- ✅ View all inventory items
- ✅ Add new items
- ✅ Edit existing items
- ✅ Delete items
- ✅ Stock adjustments (inbound/outbound)
- ✅ Real-time status updates
- ✅ Role switching (Admin/Volunteer/Recipient)

**Key Functions:**

**Add Item:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  // Refresh inventory list
  fetchItems();
};
```

**Stock Adjustment:**
```javascript
const handleStockAdjustment = async (quantity, type, counterparty) => {
  const isOutbound = type.startsWith('Outbound');
  const change = isOutbound ? -quantity : quantity;
  let newStock = currentStock + change;
  
  // Validate
  if (isOutbound && newStock < 0) {
    alert('Insufficient stock');
    return;
  }
  
  // Update
  await updateItem({ currentStock: newStock });
};
```

**UI Components:**
- Form for adding/editing items
- Table displaying all items
- Transaction modal for stock adjustments
- Status indicators (critical/low/adequate)
- Role toggle for switching views

---

### 2. VolunteerPage 🤝

**Features:**
- ✅ Submit donations
- ✅ View donation history
- ✅ Track donation status
- ✅ Category selection
- ✅ Location specification

**Donation Flow:**
```javascript
const submitDonation = async (donationData) => {
  const response = await fetch('/api/donations', {
    method: 'POST',
    body: JSON.stringify({
      itemName: donationData.item,
      category: donationData.category,
      quantity: donationData.quantity,
      location: donationData.location
    })
  });
  
  // Show success message
  alert('Donation submitted! Awaiting admin approval.');
};
```

---

### 3. RecipientPage 🏠

**Features:**
- ✅ Submit supply requests
- ✅ View request history
- ✅ Track request status
- ✅ Priority selection
- ✅ Delivery location

**Request Flow:**
```javascript
const submitRequest = async (requestData) => {
  const response = await fetch('/api/requests', {
    method: 'POST',
    body: JSON.stringify({
      itemName: requestData.item,
      category: requestData.category,
      quantity: requestData.quantity,
      location: requestData.location,
      priority: requestData.priority
    })
  });
  
  // Show success message
  alert('Request submitted! We will process it shortly.');
};
```

---

## Business Logic

### 1. Automatic Inventory Updates

**When Donation Approved:**
```javascript
if (donation.status === 'approved') {
  // Find existing item
  const item = await InventoryItem.findOne({
    name: donation.itemName,
    location: donation.location
  });
  
  if (item) {
    // Update existing
    item.currentStock += donation.quantity;
  } else {
    // Create new
    await InventoryItem.create({
      name: donation.itemName,
      category: donation.category,
      currentStock: donation.quantity,
      // ... other fields
    });
  }
}
```

**When Request Approved:**
```javascript
if (request.status === 'approved') {
  const item = await InventoryItem.findOne({
    name: request.itemName,
    location: request.location
  });
  
  if (item && item.currentStock >= request.quantity) {
    // Deduct stock
    item.currentStock -= request.quantity;
    
    // Update status
    if (item.currentStock <= 0) {
      item.status = 'critical';
    } else if (item.currentStock < item.minThreshold) {
      item.status = 'low';
    }
    
    await item.save();
  }
}
```

---

### 2. Stock Status Management

**Automatic Status Updates:**
```javascript
const updateItemStatus = (item) => {
  if (item.currentStock <= 0) {
    item.status = 'critical';
  } else if (item.currentStock < item.minThreshold) {
    item.status = 'low';
  } else {
    item.status = 'adequate';
  }
  return item;
};
```

**Status Colors:**
- 🔴 **Critical:** Red (0 stock)
- 🟡 **Low:** Yellow (below threshold)
- 🟢 **Adequate:** Green (sufficient stock)

---

### 3. Transaction Validation

**Outbound Validation:**
```javascript
const validateOutbound = (item, quantity) => {
  if (quantity > item.currentStock) {
    throw new Error(
      `Cannot send ${quantity} units. Only ${item.currentStock} in stock.`
    );
  }
  return true;
};
```

**Inbound Validation:**
```javascript
const validateInbound = (item, quantity) => {
  const newStock = item.currentStock + quantity;
  if (newStock > item.maxCapacity) {
    return {
      accepted: item.maxCapacity - item.currentStock,
      rejected: newStock - item.maxCapacity
    };
  }
  return { accepted: quantity, rejected: 0 };
};
```

---

## Integration with Other Systems

### 1. Emergency Response Integration

**When Emergency Created:**
```javascript
// Emergency system requests resources
const emergency = await Emergency.create({...});

// Check inventory for required resources
const requiredResources = emergency.response.resources.immediate;

for (const resource of requiredResources) {
  const item = await InventoryItem.findOne({ name: resource });
  
  if (item && item.currentStock > 0) {
    // Reserve resources
    item.currentStock -= requiredQuantity;
    await item.save();
  } else {
    // Alert: Insufficient resources
    emergency.warnings.push(`Low stock: ${resource}`);
  }
}
```

---

### 2. Dispatch Integration

**When Dispatch Created:**
```javascript
// Dispatch service allocates resources
const dispatch = await createDispatch(emergencyId);

// Get resources from inventory
const centers = await findNearestCenters(emergency.location);

for (const center of centers) {
  const items = await InventoryItem.find({
    location: center.name,
    currentStock: { $gt: 0 }
  });
  
  // Allocate resources
  dispatch.resources = items.map(item => ({
    name: item.name,
    quantity: Math.min(item.currentStock, requiredQuantity),
    source: center.name
  }));
}
```

---

### 3. Live Disasters Integration

**Resource Recommendations:**
```javascript
const getResourcesForDisasterType = (disasterType) => {
  const resourceMap = {
    flood: ['Water Pumps', 'Boats', 'Life Jackets', 'Medical Kit'],
    fire: ['Fire Extinguishers', 'Water Tanks', 'Protective Gear'],
    earthquake: ['Search Equipment', 'Medical Kit', 'Shelter', 'Food']
  };
  
  const resources = resourceMap[disasterType];
  
  // Check inventory availability
  return Promise.all(
    resources.map(async (resource) => {
      const item = await InventoryItem.findOne({ name: resource });
      return {
        name: resource,
        available: item?.currentStock || 0,
        status: item?.status || 'unavailable'
      };
    })
  );
};
```

---

## User Roles & Permissions

### Admin 👨‍💼
**Can:**
- ✅ View all inventory
- ✅ Add/Edit/Delete items
- ✅ Approve donations
- ✅ Approve requests
- ✅ Manage locations
- ✅ View all transactions
- ✅ Generate reports

### Volunteer 🤝
**Can:**
- ✅ Submit donations
- ✅ View own donation history
- ✅ Track donation status
- ❌ Cannot access full inventory
- ❌ Cannot approve requests

### Recipient 🏠
**Can:**
- ✅ Submit supply requests
- ✅ View own request history
- ✅ Track request status
- ❌ Cannot access full inventory
- ❌ Cannot submit donations

---

## Data Flow Examples

### Example 1: Donation Flow

```
1. Volunteer submits donation
   POST /api/donations
   {
     itemName: "Bottled Water",
     category: "Water",
     quantity: 100,
     location: "Community Center"
   }

2. Admin reviews donation
   GET /api/donations?status=pending

3. Admin approves
   PUT /api/donations/:id
   { status: "approved", approvedBy: "admin" }

4. System auto-adds to inventory
   - Find or create InventoryItem
   - Add quantity to currentStock
   - Update status

5. Volunteer receives notification
   "Your donation has been approved!"
```

---

### Example 2: Request Flow

```
1. Recipient submits request
   POST /api/requests
   {
     itemName: "Emergency Food Kits",
     category: "Food",
     quantity: 20,
     location: "Shelter B",
     priority: "high"
   }

2. System checks inventory
   - Find item in inventory
   - Check if sufficient stock

3. Auto-approve if available
   PUT /api/requests/:id
   { status: "approved" }

4. Deduct from inventory
   - Reduce currentStock
   - Update status if needed

5. Create dispatch
   - Assign delivery team
   - Calculate route
   - Track delivery

6. Mark as delivered
   PUT /api/requests/:id
   { status: "delivered" }
```

---

## Performance Optimizations

### 1. Database Indexing
```javascript
// Add indexes for faster queries
inventoryItemSchema.index({ category: 1, location: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ name: 'text' });
```

### 2. Caching
```javascript
// Cache frequently accessed items
const cache = new Map();

const getInventoryItems = async () => {
  if (cache.has('items')) {
    return cache.get('items');
  }
  
  const items = await InventoryItem.find();
  cache.set('items', items);
  setTimeout(() => cache.delete('items'), 60000); // 1 min cache
  
  return items;
};
```

### 3. Pagination
```javascript
// Paginate large result sets
router.get('/items', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  
  const items = await InventoryItem.find()
    .skip(skip)
    .limit(limit);
  
  const total = await InventoryItem.countDocuments();
  
  res.json({
    items,
    page,
    totalPages: Math.ceil(total / limit),
    total
  });
});
```

---

## Security Considerations

### 1. Input Validation
```javascript
// Validate all inputs
const validateInventoryItem = (data) => {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Item name is required');
  }
  
  if (data.currentStock < 0) {
    throw new Error('Stock cannot be negative');
  }
  
  if (!CATEGORIES.includes(data.category)) {
    throw new Error('Invalid category');
  }
  
  return true;
};
```

### 2. Authentication
```javascript
// Protect routes with authentication
router.post('/items', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  // ... create item
});
```

### 3. Rate Limiting
```javascript
// Prevent abuse
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.use('/api/inventory', limiter);
```

---

## Testing

### Unit Tests
```javascript
describe('Inventory Item', () => {
  it('should create new item', async () => {
    const item = await InventoryItem.create({
      name: 'Test Item',
      category: 'Medical',
      currentStock: 100,
      // ... other fields
    });
    
    expect(item.name).toBe('Test Item');
    expect(item.status).toBe('adequate');
  });
  
  it('should update status when stock is low', async () => {
    const item = await InventoryItem.create({...});
    item.currentStock = 5;
    item.minThreshold = 10;
    
    // Status should auto-update to 'low'
    expect(item.status).toBe('low');
  });
});
```

---

## Future Enhancements

### Planned Features:
1. **Barcode Scanning** 📱
   - QR code generation for items
   - Mobile app for scanning

2. **Predictive Analytics** 📊
   - Forecast demand based on historical data
   - Auto-reorder when stock is low

3. **Multi-Location Transfer** 🚚
   - Transfer items between warehouses
   - Track shipments in real-time

4. **Expiry Date Tracking** 📅
   - Alert for expiring items
   - FIFO (First In, First Out) management

5. **Batch Management** 📦
   - Track items by batch number
   - Quality control

6. **Reporting Dashboard** 📈
   - Visual analytics
   - Export reports (PDF, Excel)

7. **Mobile App** 📱
   - Native iOS/Android apps
   - Offline mode

---

## Summary

The Inventory Management System provides:

✅ **Complete CRUD Operations** - Add, view, edit, delete items
✅ **Real-Time Tracking** - Live stock updates
✅ **Multi-Role Support** - Admin, Volunteer, Recipient
✅ **Automated Workflows** - Auto-approve, auto-deduct
✅ **Integration Ready** - Works with Emergency, Dispatch, Disasters
✅ **Status Management** - Critical, Low, Adequate alerts
✅ **Transaction History** - Full audit trail
✅ **Donation System** - Volunteer contributions
✅ **Request System** - Recipient supply requests

**The inventory system is production-ready and fully integrated with your disaster relief platform! 📦**
