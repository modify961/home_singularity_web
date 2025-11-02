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

export const jobsForPage = ( query = {}, headers = {}) => {
    return request("/base_scheduler", "/list", "POST", query, headers);
};

export const addOrEditJob = ( jobInfo, headers = {}) => {
    return request("/base_scheduler", "/save", "POST", jobInfo, headers);
};

export const deleteJob = ( id, headers = {}) => {
    return request("/base_scheduler", "/delete", "POST", { id }, headers);
};

export const enableJob = ( id, enabled, headers = {}) => {
    return request("/base_scheduler", "/enable", "POST", { id, enabled }, headers);
};

export const runJobOnce = ( id, headers = {}) => {
    return request("/base_scheduler", "/run_once", "POST", { id }, headers);
};

export const schedulerLogs = ( query = {}, headers = {}) => {
    return request("/base_scheduler", "/logs", "POST", query, headers);
};
