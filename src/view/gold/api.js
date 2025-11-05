
export const allNews = (stock_code, headers = {}) => {
  return request("/gold_news", "/all_nws", "POST", {}, headers);
};

export const newById = (id, headers = {}) => {
  return request("/gold_news", "/new_by_id", "POST", id, headers);
};

export const allMarkets = (headers = {}) => {
  return request("/gold_base", "/all_markets", "POST", {}, headers);
};

export const getSnapshotByMarkets = (query = {}, headers = {}) => {
  return request("/gold_base", "/get_gold_price", "POST", query, headers);
};

// 删除新闻的接口
export const updateDeletedStatus = (goldNewsArticle, headers = {}) => {
  return request("/gold_news", "/update_deleted_status", "POST", goldNewsArticle, headers);
};
export const generateSummaryCards = (id, headers = {}) => {
  return request("/gold_news", "/gen_summary_cards", "POST", id, headers);
};
