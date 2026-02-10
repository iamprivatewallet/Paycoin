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
    // baseURL: 'https://sandbox-api.privatex.io/sdk/api/v2/exchange',//测试
    baseURL: 'https://pay.dogpay.io/api',//正式
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const lang = localStorage.getItem('lang');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Accept-Language"] = lang;
    return config;
});

instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        return response;
    },
    (error) => {
        if (!error.response) {
            return Promise.resolve({
                data: {
                    code: -1,
                    msg: 'Network Error',
                    data: null,
                },
            });
        }

        const { status, data } = error.response;

        if (status === 401) {
            localStorage.removeItem('token');
        }

        return Promise.resolve({
            data: {
                code: data?.code ?? status,
                msg: data?.msg ?? 'Request Error',
                data: null,
            },
        });
    }
);

export function request<T = any>(
    config: AxiosRequestConfig
): Promise<{ code: number; msg: string; data: T }> {
    return instance
        .request<ApiResponse<T>>(config)
        .then((res) => {
            const { code, msg, data } = res.data;
            return { code, msg, data };
        });
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
