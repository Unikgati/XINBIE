declare module 'midtrans-client' {
  export class CoreApi {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    charge(payload: any): Promise<any>;
    transaction: {
      notification(payload: any): Promise<any>;
      status(transactionId: string): Promise<any>;
      approve(transactionId: string): Promise<any>;
      deny(transactionId: string): Promise<any>;
      cancel(transactionId: string): Promise<any>;
      expire(transactionId: string): Promise<any>;
      refund(transactionId: string, payload: any): Promise<any>;
    };
  }

  export class Snap {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    createTransaction(payload: any): Promise<any>;
    createTransactionToken(payload: any): Promise<any>;
    createTransactionRedirectUrl(payload: any): Promise<any>;
  }
}
