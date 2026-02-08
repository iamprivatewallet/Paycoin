export interface IQueryOrderParams {
    orderId: string
    e: string
}

export interface QueryOrderResponse {
    chainName: string;
    address: string;
    quantity: string;
    tokenId: number;
    orderId: string;
    partnerName: string;
    tokenName: string;
    contractAddress: string;
    remark: string;
    expiredTime: number;
    chainId: number;
    outOrderId: string;
    logo: string;
    lang: string;
    txHash: number;
    status: number;
    tokenPrice:number|string;
}