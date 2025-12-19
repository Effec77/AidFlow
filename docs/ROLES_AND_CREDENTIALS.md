# User Roles and Test Credentials

## Available Roles

The system supports four distinct user roles:

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

**Test Credentials:**
- Username: `admin@edu.in`
- Password: `AdminPassword123`

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

**Test Credentials:**
- Username: `branchmanager@edu.in`
- Password: `BranchManager123`

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

**Test Credentials:**
- Username: `volunteer`
- Password: `VolunteerPass123`

### 4. Affected Citizen
**Submit requests and track cases:**
- ✅ Create emergency requests
- ✅ View inventory
- ✅ Request items
- ✅ View own requests
- ❌ Cannot donate
- ❌ Cannot view disasters
- ❌ Cannot access any management features

**Test Credentials:**
- Username: `citizen@test.com`
- Password: `CitizenPass123`

## Registration

During registration, users can select:
- **Volunteer/Organization** - For volunteers and organizations
- **Affected Citizen** - For citizens affected by disasters

**Note:** Admin and Branch Manager roles are typically created by system administrators and are not available for public registration. This ensures proper access control and security.

## Role Assignment

- **Public Registration:** Volunteer, Affected Citizen
- **Admin Created:** Admin, Branch Manager

## Seed Users

The system automatically seeds these four test users on first startup if the database is empty. All seed users are created with complete profile information for testing purposes.


