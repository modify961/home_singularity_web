export const syncInfoForPage = (queryInfo, headers = {}) => {
    return request("/base_platform", "/sync_info_for_page", "POST", queryInfo, headers);
};