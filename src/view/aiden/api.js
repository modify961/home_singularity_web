export const chatToRanker = (rankerRequest, headers = {}) => {
    return request("/chattoranker", "/chat_to_ranker_research", "POST",rankerRequest, headers);
};

export const searchForRanker = (rankerRequest, headers = {}) => {
    return request("/chattoranker", "/search_for_ranker", "POST",rankerRequest, headers);
};

export const toRankerNormalReceptionist = (rankerRequest, headers = {}) => {
    return request("/chattoranker", "/chat_to_ranker_normal_receptionist", "POST",rankerRequest, headers);
};
