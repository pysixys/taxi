import { TAction } from '../../types'
import { IOrder } from '../../types/types'
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

export const watchOrder = (payload: IOrder['b_id']): TAction =>
  ({ type: ActionTypes.WATCH_ORDER, payload })
export const getOrder = (payload: IOrder['b_id']): TAction =>
  ({ type: ActionTypes.GET_ORDER_REQUEST, payload })
export const unwatchOrder = (payload: IOrder['b_id']): TAction =>
  ({ type: ActionTypes.UNWATCH_ORDER, payload })
export const startMutation = (payload: IOrder['b_id']): TAction =>
  ({ type: ActionTypes.START_MUTATION, payload })
export const endMutation = (payload: IOrder['b_id']): TAction =>
  ({ type: ActionTypes.END_MUTATION, payload })

export const clearOrders = (): TAction => {
  return { type: ActionTypes.CLEAR }
}