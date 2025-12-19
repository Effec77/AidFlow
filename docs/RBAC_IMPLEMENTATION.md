# Role-Based Access Control (RBAC) Implementation

## Overview
This document describes the RBAC system implemented in AidFlow, which controls access to features and routes based on user roles.

## Roles

### 1. Admin
**Full system access:**
- ✅ View and manage all emergencies
- ✅ Dispatch resources
- ✅ Full inventory management (CRUD)
- ✅ Approve donations and requests
- ✅ Create and manage disaster zones
- ✅ Access routing and agent management
- ✅ View analytics
- ✅ Can donate and request items

**Accessible Routes:**
- `/inventory` - Inventory Management
- `/volunteer` - Volunteer Portal
- `/recipient` - Request Portal
- `/emergency-dashboard` - Emergency Dashboard
- `/dispatch-tracker` - Dispatch Tracker
- `/live-disasters` - Live Disasters
- `/inventory-live` - Live Inventory
- `/routing` - Smart Routing
- `/analytics` - Analytics
- `/emergency` - Emergency Request

### 2. Branch Manager
**Limited admin access:**
- ✅ View and manage emergencies
- ✅ Dispatch resources
- ✅ View and manage inventory
- ✅ Approve donations and requests
- ✅ View disaster zones
- ✅ Access routing (view and calculate)
- ✅ View analytics
- ❌ Cannot create/manage disaster zones
- ❌ Cannot manage agents

**Accessible Routes:**
- `/inventory` - Inventory Management
- `/emergency-dashboard` - Emergency Dashboard
- `/dispatch-tracker` - Dispatch Tracker
- `/live-disasters` - Live Disasters (view only)
- `/inventory-live` - Live Inventory
- `/routing` - Smart Routing
- `/analytics` - Analytics
- `/emergency` - Emergency Request

### 3. Volunteer
**Can donate and support operations:**
- ✅ View emergencies
- ✅ Create emergency requests
- ✅ View inventory
- ✅ Donate items
- ✅ View own donations
- ✅ View disaster zones
- ✅ View routing (read-only)
- ❌ Cannot manage emergencies
- ❌ Cannot dispatch resources
- ❌ Cannot approve donations/requests
- ❌ Cannot access analytics

**Accessible Routes:**
- `/inventory` - Inventory Management (view)
- `/volunteer` - Volunteer Portal
- `/live-disasters` - Live Disasters (view)
- `/inventory-live` - Live Inventory
- `/emergency` - Emergency Request

### 4. Affected Citizen
**Submit requests and track cases:**
- ✅ Create emergency requests
- ✅ View inventory
- ✅ Request items
- ✅ View own requests
- ❌ Cannot donate
- ❌ Cannot view disasters
- ❌ Cannot access any management features

**Accessible Routes:**
- `/recipient` - Request Portal
- `/emergency` - Emergency Request

## Implementation Details

### Backend RBAC
Located in `backend/middleware/auth.js`:
- `protect` - Verifies JWT token
- `authorize(...roles)` - Checks if user has required role

**Example Usage:**
```javascript
app.post("/api/volunteer/donate", protect, authorize('volunteer', 'admin'), async (req, res) => {
  // Only volunteers and admins can access
});
```

### Frontend RBAC

#### 1. RBAC Utilities (`frontend/src/utils/rbac.js`)
- `hasPermission(userRole, permission)` - Check single permission
- `hasAnyPermission(userRole, permissions)` - Check if user has any permission
- `hasAllPermissions(userRole, permissions)` - Check if user has all permissions
- `canAccessRoute(userRole, route)` - Check route access
- `hasRole(userRole, roles)` - Check role membership

#### 2. ProtectedRoute Component
Wraps routes that require authentication and/or specific roles:
```jsx
<Route 
  path="/inventory" 
  element={
    <ProtectedRoute requiredRole={['admin', 'branch manager', 'volunteer']}>
      <InventoryPage />
    </ProtectedRoute>
  } 
/>
```

#### 3. PermissionGate Component
Conditionally renders UI elements based on permissions:
```jsx
<PermissionGate permission={PERMISSIONS.MANAGE_INVENTORY}>
  <button>Delete Item</button>
</PermissionGate>
```

#### 4. Header Navigation
The header automatically shows/hides menu items based on user role:
- Emergency Operations dropdown only shows accessible routes
- Dashboard dropdown shows role-appropriate dashboards
- Account dropdown shows user role and logout option

## Permissions

### Emergency Management
- `VIEW_EMERGENCIES` - View emergency list
- `CREATE_EMERGENCY` - Create new emergency requests
- `MANAGE_EMERGENCIES` - Full emergency management
- `DISPATCH_RESOURCES` - Dispatch resources to emergencies

### Inventory Management
- `VIEW_INVENTORY` - View inventory items
- `MANAGE_INVENTORY` - Full inventory CRUD operations
- `APPROVE_DONATIONS` - Approve volunteer donations
- `APPROVE_REQUESTS` - Approve citizen requests

### Disaster Management
- `VIEW_DISASTERS` - View disaster zones
- `CREATE_DISASTERS` - Create new disaster zones
- `MANAGE_DISASTERS` - Full disaster zone management

### Routing & Agents
- `VIEW_ROUTING` - View routing information
- `CALCULATE_ROUTES` - Calculate optimal routes
- `MANAGE_AGENTS` - Manage AI agents

### Donations & Requests
- `DONATE_ITEMS` - Donate items to inventory
- `REQUEST_ITEMS` - Request items from inventory
- `VIEW_OWN_DONATIONS` - View own donation history
- `VIEW_OWN_REQUESTS` - View own request history

### Analytics
- `VIEW_ANALYTICS` - View system analytics

## Route Access Matrix

| Route | Admin | Branch Manager | Volunteer | Affected Citizen |
|-------|-------|----------------|----------|-----------------|
| `/inventory` | ✅ | ✅ | ✅ | ❌ |
| `/volunteer` | ✅ | ❌ | ✅ | ❌ |
| `/recipient` | ✅ | ❌ | ❌ | ✅ |
| `/emergency-dashboard` | ✅ | ✅ | ❌ | ❌ |
| `/dispatch-tracker` | ✅ | ✅ | ❌ | ❌ |
| `/live-disasters` | ✅ | ✅ | ✅ | ❌ |
| `/inventory-live` | ✅ | ✅ | ✅ | ❌ |
| `/routing` | ✅ | ✅ | ❌ | ❌ |
| `/analytics` | ✅ | ✅ | ❌ | ❌ |
| `/emergency` | ✅ | ✅ | ✅ | ✅ |

## Usage Examples

### Protecting a Route
```jsx
import ProtectedRoute from './components/ProtectedRoute';

<Route 
  path="/admin-panel" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
```

### Conditional UI Rendering
```jsx
import PermissionGate from './components/PermissionGate';
import { PERMISSIONS } from '../utils/rbac';

<PermissionGate permission={PERMISSIONS.MANAGE_INVENTORY}>
  <button onClick={handleDelete}>Delete Item</button>
</PermissionGate>
```

### Checking Permissions in Components
```jsx
import { useContext } from 'react';
import { UserContext } from './UserContext';
import { hasPermission, PERMISSIONS } from '../utils/rbac';

const MyComponent = () => {
  const { userRole } = useContext(UserContext);
  
  const canDelete = hasPermission(userRole, PERMISSIONS.MANAGE_INVENTORY);
  
  return (
    <div>
      {canDelete && <button>Delete</button>}
    </div>
  );
};
```

## Security Notes

1. **Backend is Authoritative**: Frontend RBAC is for UX only. Backend must always verify permissions.

2. **Token Validation**: All protected routes verify JWT tokens on the backend.

3. **Role Verification**: Backend `authorize` middleware checks roles before processing requests.

4. **Default Deny**: Routes not explicitly allowed are denied by default.

5. **Token Expiration**: JWT tokens expire after 30 days (configurable via `JWT_EXPIRES_IN`).

## Future Enhancements

- [ ] Permission-based feature flags
- [ ] Audit logging for permission checks
- [ ] Dynamic role assignment
- [ ] Role hierarchy support
- [ ] Time-based access control


