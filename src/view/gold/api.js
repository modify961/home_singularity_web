export const allNews = (stock_code, headers = {}) => {
    return request("/gold_news", "/all_nws", "POST", {}, headers);
};

export const newById = (id, headers = {}) => {
    return request("/gold_news", "/new_by_id", "POST",id, headers);
};