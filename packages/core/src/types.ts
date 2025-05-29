export interface IHandler<TRequest, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}
