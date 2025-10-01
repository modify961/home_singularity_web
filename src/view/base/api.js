export const allRoles = ( headers = {}) => {
    return request("/base_info", "/all_roles", "POST", {}, headers);
};
