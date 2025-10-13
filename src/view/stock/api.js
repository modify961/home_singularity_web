export const obtainByCodeOrName = (stock_code, headers = {}) => {
    return request("/stock", "/obtain_by_code_or_name", "POST", stock_code, headers);
};