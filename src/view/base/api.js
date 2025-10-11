export const allRoles = ( headers = {}) => {
    return request("/base_info", "/all_roles", "POST", {}, headers);
};

export const addOrEditRole = ( baseRoleInfo,headers = {}) => {
    return request("/base_info", "/add_or_edit_role", "POST", baseRoleInfo, headers);
};
export const delRole = ( roleId,headers = {}) => {
    return request("/base_info", "/del_role", "POST", roleId, headers);
};

export const addOrEditMenu = ( baseMenuInfo,headers = {}) => {
    return request("/base_info", "/add_or_edit_menu", "POST", baseMenuInfo, headers);
};
export const delMenu = ( menuId,headers = {}) => {
    return request("/base_info", "/del_menu", "POST", menuId, headers);
};