import { get, post } from '../request';
import { IQueryOrderParams, QueryOrderResponse } from "../types"


export const queryOrder = (data: IQueryOrderParams) => {
    return post<QueryOrderResponse>('/cashier/order/query', data);
};