import { TAction } from '../../types'
import { IOrder } from '../../types/types'
import * as API from '../../API'
import { IDispatch } from '..'
import { ActionTypes } from './constants'

export const getActiveOrders = (payload: GetOrdersParams = {}): TAction =>
  ({ type: ActionTypes.GET_ACTIVE_ORDERS_REQUEST, payload })
export const getReadyOrders = (payload: GetOrdersParams = {}): TAction =>
  ({ type: ActionTypes.GET_READY_ORDERS_REQUEST, payload })
export const getHistoryOrders = (payload: GetOrdersParams = {}): TAction =>
  ({ type: ActionTypes.GET_HISTORY_ORDERS_REQUEST, payload })
export interface GetOrdersParams {
  estimate?: boolean
}

export const watchOrder = (
  payload: IOrder['b_id'],
) => (dispatch: IDispatch) => {
  dispatch({ type: ActionTypes.WATCH_ORDER, payload })
  return () => {
    dispatch({ type: ActionTypes.UNWATCH_ORDER, payload })
  }
}

export const clearOrders = (): TAction => ({ type: ActionTypes.CLEAR })

export const take = (
  id: IOrder['b_id'],
  ...params: Parameters<
    typeof API.takeOrder
  > extends [any, ...infer Rest] ? Rest : never
) => mutationThunk(() => API.takeOrder(id, ...params), id)
export const setState = (
  id: IOrder['b_id'],
  ...params: Parameters<
    typeof API.setOrderState
  > extends [any, ...infer Rest] ? Rest : never
) => mutationThunk(() => API.setOrderState(id, ...params), id)

const mutationThunk = <TReturn>(
  mutation: () => Promise<TReturn>,
  id: IOrder['b_id'],
) => async(
    dispatch: IDispatch,
  ): Promise<TReturn> => {
    dispatch({ type: ActionTypes.START_MUTATION, payload: id })
    try {
      return await mutation()
    } finally {
      dispatch({ type: ActionTypes.END_MUTATION, payload: id })
    }
  }