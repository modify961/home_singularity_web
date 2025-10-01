export const initMenu = ( headers = {}) => {
    return request("/base_info", "/menu_for_user", "POST", {}, headers);
};
