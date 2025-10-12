const API_BASE_URL = window._CONFIG['BASE_URL'];

window.chatWithLLMSteam = async (url,initInfo, onProgress, onComplete) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'bearer_'+sessionStorage.getItem('token')
        },
        body: JSON.stringify(initInfo),
    });

    if (!response.ok) {
        if (response.status === 401) {
            // 清理登录状态
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user_info');
            sessionStorage.removeItem('token_expire');
            window.location.href = '/login';
            return;
        }
        throw new Error('网络错误');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let messageStr = '';
    let completed = false;
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6); // 移除 "data: "
                if (data === '[DONE]') {
                    if (!completed) {
                        onComplete && onComplete(messageStr);
                        completed = true;
                    }
                    break;
                }
                
                try {
                    const parsed = JSON.parse(data);
                    // 新流式协议：最终事件 { event: 'final', data: AidenResponse }
                    if (parsed && parsed.event === 'final') {
                        const resp = parsed.data || {};
                        const finalText = (resp && resp.response && resp.response.text) ? resp.response.text : messageStr;
                        messageStr = finalText;
                        onProgress && onProgress(finalText);
                        if (!completed) {
                            onComplete && onComplete(finalText, resp);
                            completed = true;
                        }
                    } else if (parsed && parsed.token) {
                        messageStr += parsed.token;
                        onProgress && onProgress(messageStr);
                    } else if (parsed && parsed.error) {
                        messageStr = "系统繁忙，请稍后再试";
                        onProgress && onProgress(messageStr);
                        if (!completed) {
                            onComplete && onComplete(messageStr, { error: parsed.error });
                            completed = true;
                        }
                        break;
                    }
                } catch (e) {
                    console.error('解析错误:', e);
                }
            }
        }
    }
};

// 定义全局 request 函数
const request = async (basePath, url, method = "GET", body = null, headers = {}, stream = false) => {
    headers = {
        "Content-Type": "application/json",
        'Authorization': 'bearer_'+sessionStorage.getItem('token'),
        ...headers,
    };
    
    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${basePath}${url}`, options);
    
    // 检查响应状态
    if (!response.ok) {
        if (response.status === 401) {
            // 401 未授权，清理登录状态并跳转到登录页面
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user_info');
            sessionStorage.removeItem('token_expire');
            window.location.href = '/login';
            return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    if (stream) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        
        return new ReadableStream({
            start(controller) {
                function push() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        controller.enqueue(decoder.decode(value, { stream: true }));
                        push();
                    });
                }
                push();
            }
        });
    }
    
    const result = await response.json();
    
    // 检查业务状态码
    if (result.code === 401) {
        // 401 未授权，清理登录状态并跳转到登录页面
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user_info');
        sessionStorage.removeItem('token_expire');
        window.location.href = '/login';
        return;
    }
    
    return result;
};

// 将函数挂载到全局对象
window.request = request;
global.request = request; // 兼容 Node.js 环境
