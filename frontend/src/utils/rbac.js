/**
 * Role-Based Access Control (RBAC) Utilities
 * Defines permissions and access control for different user roles
 */

// Role definitions with permissions
export const ROLES = {
  ADMIN: 'admin',
  BRANCH_MANAGER: 'branch manager',
  VOLUNTEER: 'volunteer',
  AFFECTED_CITIZEN: 'affected citizen',
};

// Permission definitions
export const PERMISSIONS = {
  // Emergency Management
  VIEW_EMERGENCIES: 'view_emergencies',
  CREATE_EMERGENCY: 'create_emergency',
  MANAGE_EMERGENCIES: 'manage_emergencies',
  DISPATCH_RESOURCES: 'dispatch_resources',
  
  // Inventory Management
  VIEW_INVENTORY: 'view_inventory',
  MANAGE_INVENTORY: 'manage_inventory',
  APPROVE_DONATIONS: 'approve_donations',
  APPROVE_REQUESTS: 'approve_requests',
  
  // Disaster Management
  VIEW_DISASTERS: 'view_disasters',
  CREATE_DISASTERS: 'create_disasters',
  MANAGE_DISASTERS: 'manage_disasters',
  
  // Routing & Agents
  VIEW_ROUTING: 'view_routing',
  CALCULATE_ROUTES: 'calculate_routes',
  MANAGE_AGENTS: 'manage_agents',
  
  // Donations & Requests
  DONATE_ITEMS: 'donate_items',
  REQUEST_ITEMS: 'request_items',
  VIEW_OWN_DONATIONS: 'view_own_donations',
  VIEW_OWN_REQUESTS: 'view_own_requests',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
};

// Role-Permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_EMERGENCIES,
    PERMISSIONS.CREATE_EMERGENCY,
    PERMISSIONS.MANAGE_EMERGENCIES,
    PERMISSIONS.DISPATCH_RESOURCES,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.APPROVE_DONATIONS,
    PERMISSIONS.APPROVE_REQUESTS,
    PERMISSIONS.VIEW_DISASTERS,
    PERMISSIONS.CREATE_DISASTERS,
    PERMISSIONS.MANAGE_DISASTERS,
    PERMISSIONS.VIEW_ROUTING,
    PERMISSIONS.CALCULATE_ROUTES,
    PERMISSIONS.MANAGE_AGENTS,
    PERMISSIONS.DONATE_ITEMS,
    PERMISSIONS.REQUEST_ITEMS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  [ROLES.BRANCH_MANAGER]: [
    PERMISSIONS.VIEW_EMERGENCIES,
    PERMISSIONS.MANAGE_EMERGENCIES,
    PERMISSIONS.DISPATCH_RESOURCES,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.APPROVE_DONATIONS,
    PERMISSIONS.APPROVE_REQUESTS,
    PERMISSIONS.VIEW_DISASTERS,
    PERMISSIONS.VIEW_ROUTING,
    PERMISSIONS.CALCULATE_ROUTES,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  [ROLES.VOLUNTEER]: [
    PERMISSIONS.VIEW_EMERGENCIES,
    PERMISSIONS.CREATE_EMERGENCY,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.DONATE_ITEMS,
    PERMISSIONS.VIEW_OWN_DONATIONS,
    PERMISSIONS.VIEW_DISASTERS,
    PERMISSIONS.VIEW_ROUTING,
  ],
  [ROLES.AFFECTED_CITIZEN]: [
    PERMISSIONS.CREATE_EMERGENCY,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.REQUEST_ITEMS,
    PERMISSIONS.VIEW_OWN_REQUESTS,
  ],
};

// Route access mapping
export const ROUTE_ACCESS = {
  '/inventory': [ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.VOLUNTEER],
  '/volunteer': [ROLES.VOLUNTEER, ROLES.ADMIN],
  '/recipient': [ROLES.AFFECTED_CITIZEN, ROLES.ADMIN],
  '/emergency-dashboard': [ROLES.ADMIN, ROLES.BRANCH_MANAGER],
  '/dispatch-tracker': [ROLES.ADMIN, ROLES.BRANCH_MANAGER],
  '/live-disasters': [ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.VOLUNTEER],
  '/inventory-live': [ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.VOLUNTEER],
  '/routing': [ROLES.ADMIN, ROLES.BRANCH_MANAGER],
  '/analytics': [ROLES.ADMIN, ROLES.BRANCH_MANAGER],
  '/emergency': [ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.VOLUNTEER, ROLES.AFFECTED_CITIZEN],
};

/**
 * Check if user has a specific permission
 * @param {string} userRole - User's role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const role = userRole.toLowerCase();
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param {string} userRole - User's role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {string} userRole - User's role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Check if user can access a specific route
 * @param {string} userRole - User's role
 * @param {string} route - Route path
 * @returns {boolean}
 */
export const canAccessRoute = (userRole, route) => {
  if (!userRole) return false;
  const allowedRoles = ROUTE_ACCESS[route];
  if (!allowedRoles) return true; // Public route if not in mapping
  return allowedRoles.includes(userRole.toLowerCase());
};

/**
 * Check if user has a specific role
 * @param {string} userRole - User's role
 * @param {string|string[]} roles - Role(s) to check
 * @returns {boolean}
 */
export const hasRole = (userRole, roles) => {
  if (!userRole) return false;
  const role = userRole.toLowerCase();
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.some(r => r.toLowerCase() === role);
};

/**
 * Get all permissions for a role
 * @param {string} userRole - User's role
 * @returns {string[]}
 */
export const getRolePermissions = (userRole) => {
  if (!userRole) return [];
  const role = userRole.toLowerCase();
  return ROLE_PERMISSIONS[role] || [];
};


