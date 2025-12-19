# Registration and RBAC Integration

## Overview
This document describes how user registration integrates with the User model and RBAC system to ensure proper role assignment and access control.

## Registration Flow

### 1. Frontend Registration Form (`frontend/src/components/Register.jsx`)

**Allowed Roles for Public Registration:**
- `volunteer` - Default role
- `affected citizen`

**Restricted Roles (Admin-created only):**
- `admin` - Cannot be registered publicly
- `branch manager` - Cannot be registered publicly

**Role Selection:**
```jsx
<select name="role" required>
  <option value="volunteer">Register as Volunteer/Organization</option>
  <option value="affected citizen">Register as Affected Citizen</option>
</select>
```

**Frontend Validation:**
- Validates role before submission
- Normalizes role (lowercase, trimmed)
- Only allows `volunteer` or `affected citizen`

### 2. Backend Registration Endpoint (`backend/server.js`)

**Role Validation:**
```javascript
// Only allow public registration for these roles
const allowedPublicRoles = ['volunteer', 'affected citizen'];
let userRole = role ? role.toLowerCase().trim() : 'volunteer';

// Validate against allowed roles
if (!allowedPublicRoles.includes(userRole)) {
  return res.status(403).json({ 
    message: `Role '${userRole}' cannot be registered publicly.` 
  });
}
```

**User Model Validation:**
- Validates role against User model enum: `['admin', 'branch manager', 'volunteer', 'affected citizen']`
- Ensures role matches RBAC definitions exactly

**Security Features:**
- Prevents role escalation (cannot register as admin/branch manager)
- Validates all required fields
- Checks for duplicate usernames
- Proper error handling for validation errors

### 3. User Model (`backend/models/User.js`)

**Role Definition:**
```javascript
role: {
    type: String,
    enum: ['admin', 'branch manager', 'volunteer', 'affected citizen'],
    default: 'volunteer'
}
```

**Role Constraints:**
- Must match one of the four defined roles exactly
- Case-sensitive matching
- Default role: `volunteer`

### 4. RBAC Integration (`frontend/src/utils/rbac.js`)

**Role Constants:**
```javascript
export const ROLES = {
  ADMIN: 'admin',
  BRANCH_MANAGER: 'branch manager',
  VOLUNTEER: 'volunteer',
  AFFECTED_CITIZEN: 'affected citizen',
};
```

**Role-Permission Mapping:**
Each role has specific permissions defined in `ROLE_PERMISSIONS`:
- **Admin**: Full system access
- **Branch Manager**: Limited admin access
- **Volunteer**: Can donate, view operations
- **Affected Citizen**: Can request items, track cases

## Registration Process Flow

```
1. User fills registration form
   ↓
2. Frontend validates role (volunteer/affected citizen only)
   ↓
3. Request sent to /api/register
   ↓
4. Backend validates:
   - Required fields present
   - Username not duplicate
   - Role is in allowedPublicRoles
   - Role matches User model enum
   ↓
5. User created with validated role
   ↓
6. JWT token generated with role
   ↓
7. User redirected based on role:
   - volunteer → /volunteer
   - affected citizen → /recipient
```

## Role Assignment Rules

### Public Registration (via `/api/register`)
✅ **Allowed:**
- `volunteer` - Default role
- `affected citizen`

❌ **Restricted:**
- `admin` - Must be created by system administrator
- `branch manager` - Must be created by system administrator

### Admin-Created Users
Admins can create users with any role via:
- Direct database insertion
- Admin panel (if implemented)
- Seed scripts (`backend/seedUsers.js`)

## Security Measures

1. **Role Validation:**
   - Frontend validation before submission
   - Backend validation against allowed roles
   - User model enum validation

2. **Role Normalization:**
   - All roles normalized to lowercase
   - Trimmed to remove whitespace
   - Ensures consistency with RBAC

3. **Error Handling:**
   - Clear error messages for invalid roles
   - Prevents role escalation attempts
   - Logs suspicious registration attempts

4. **Token Generation:**
   - JWT token includes role
   - Role verified on every authenticated request
   - Backend middleware enforces role-based access

## Testing Registration

### Test Cases

1. **Valid Volunteer Registration:**
   ```json
   {
     "username": "testvolunteer",
     "password": "Test123456",
     "firstName": "Test",
     "lastName": "Volunteer",
     "role": "volunteer",
     "country": "USA",
     "state": "CA",
     "city": "San Francisco",
     "address": "123 Main St",
     "companyType": "Individual",
     "occupation": "Engineer"
   }
   ```

2. **Valid Affected Citizen Registration:**
   ```json
   {
     "username": "testcitizen",
     "password": "Test123456",
     "firstName": "Test",
     "lastName": "Citizen",
     "role": "affected citizen",
     "country": "USA",
     "state": "CA",
     "city": "San Francisco",
     "address": "123 Main St",
     "companyType": "Individual",
     "occupation": "Teacher"
   }
   ```

3. **Invalid Role Attempt (Should Fail):**
   ```json
   {
     "role": "admin"  // Should be rejected
   }
   ```

## Role Alignment Checklist

✅ **User Model Enum** matches **RBAC ROLES**
✅ **Registration Allowed Roles** subset of **User Model Enum**
✅ **Frontend Role Options** match **Registration Allowed Roles**
✅ **JWT Token** includes role from **User Model**
✅ **RBAC Permissions** defined for all **User Model Roles**
✅ **Route Access** configured for all **RBAC Roles**

## Maintenance

When adding new roles:
1. Update `backend/models/User.js` enum
2. Update `frontend/src/utils/rbac.js` ROLES constant
3. Add permissions in `ROLE_PERMISSIONS`
4. Update route access in `ROUTE_ACCESS`
5. Update registration allowed roles (if public)
6. Update seed users (if needed)


