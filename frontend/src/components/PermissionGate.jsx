import React, { useContext } from 'react';
import { UserContext } from './UserContext';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/rbac';

/**
 * Permission Gate Component
 * Conditionally renders children based on user permissions
 */
const PermissionGate = ({ 
  children, 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null 
}) => {
  const { userRole } = useContext(UserContext);

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(userRole, permission);
  } else if (permissions) {
    if (requireAll) {
      hasAccess = hasAllPermissions(userRole, permissions);
    } else {
      hasAccess = hasAnyPermission(userRole, permissions);
    }
  }

  return hasAccess ? children : fallback;
};

export default PermissionGate;


