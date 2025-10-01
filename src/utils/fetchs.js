const API_BASE_URL = window._CONFIG['BASE_URL'];

window.chatWithLLMSteam = async (url,initInfo, onProgress, onComplete) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'sk-szyd-asdf098765!!'
        },
        body: JSON.stringify(initInfo),
    });

    if (!response.ok) throw new Error('网络错误');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let messageStr = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6); // 移除 "data: "
                if (data === '[DONE]') {
                    onComplete && onComplete(messageStr);
                    break;
                }
                
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.token) {
                        messageStr += parsed.token;
                        onProgress && onProgress(messageStr);
                    } else if (parsed.error) {
                        messageStr = "系统繁忙，请稍后再试";
                        onProgress && onProgress(messageStr);
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
        'Authorization': 'sk-szyd-asdf098765!!',
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
    if (!response.ok) {
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
    
    return response.json();
};

// 将函数挂载到全局对象
window.request = request;
global.request = request; // 兼容 Node.js 环境