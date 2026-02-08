import { get, post } from '../request';
import { IQueryOrderParams, QueryOrderResponse } from "../types"


export const queryOrder = (data: IQueryOrderParams) => {
    return post<QueryOrderResponse>('/sdk/api/v2/exchange/cashier/order/query', data);
};