import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from 'axios';

export interface ApiResponse<T = any> {
    code: number;
    msg: string;  // 改成 msg
    data: T;
}

const instance: AxiosInstance = axios.create({
    baseURL: 'https://sandbox-api.privatex.io',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        // 注意这里 code = 1 表示成功，修改判断逻辑
        if (response.data.code !== 1) {
            return Promise.reject(
                new Error(response.data.msg || 'Request Error')
            );
        }
        return response; // 返回完整响应
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // 可选：跳转登录
        }
        return Promise.reject(error);
    }
);

export function request<T = any>(
    config: AxiosRequestConfig
): Promise<T> {
    return instance
        .request<ApiResponse<T>>(config)
        .then((res) => res.data.data);
}

export function get<T = any>(url: string, config?: AxiosRequestConfig) {
    return request<T>({
        url,
        method: 'GET',
        ...config,
    });
}

export function post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
) {
    return request<T>({
        url,
        method: 'POST',
        data,
        ...config,
    });
}

export default instance;
