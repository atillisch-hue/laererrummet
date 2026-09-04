export type AppRole="teacher"|"staff"|"leader"|"admin"|"parent"|"board";

export function userRoles(user:any):AppRole[]{
 const app=user?.app_metadata||{};
 const values=[...(Array.isArray(app.roles)?app.roles:[]),app.role].filter(Boolean);
 return Array.from(new Set(values)).filter((r):r is AppRole=>r==="teacher"||r==="staff"||r==="leader"||r==="admin"||r==="parent"||r==="board");
}

export function hasRole(user:any,role:AppRole){return userRoles(user).includes(role)}
