export const latestSnapshot = ( headers = {}) => {
    return request("/gold", "/latest_snapshot", "POST", {}, headers);
};