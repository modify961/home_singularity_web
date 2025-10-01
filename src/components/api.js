export const initMenu = (userId, headers = {}) => {
    return request("/menu", "/init", "POST", userId, headers);
};

// 获取历史消息记录
export const getMessagesByUserId = (userId, page = 1, pageSize = 20, headers = {}) => {
    // 对于GET请求，将参数作为URL查询参数传递
    const queryParams = new URLSearchParams({
        user_id: userId,
        page: page,
        page_size: pageSize
    }).toString();
    return request("/chattoranker", `/get_messages_by_user_id?${queryParams}`, "GET", null, headers);
};

export const portal_chat_with_tool = (rankerRequest, headers = {}) => {
    return request("/chattoranker", "/portal_chat_with_tool", "POST",rankerRequest, headers);
};
