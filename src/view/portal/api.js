export const latestSnapshot = ( headers = {}) => {
    return request("/gold_base", "/latest_gold_price", "POST", {}, headers);
};
export const latestBriefs = ( symbol,headers = {}) => {
    return request("/gold_briefs", "/latest", "POST", symbol, headers);
};
