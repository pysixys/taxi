import { RecordOf, Map as ImmutableMap } from 'immutable'
import { appName } from '../../constants'
import { IOrder } from '../../types/types'

export const moduleName = 'orders'

const prefix = `${appName}/${moduleName}`

export const ActionTypes = {
  GET_ACTIVE_ORDERS_REQUEST: `${prefix}/GET_ACTIVE_ORDERS_REQUEST`,
  GET_ACTIVE_ORDERS_SUCCESS: `${prefix}/GET_ACTIVE_ORDERS_SUCCESS`,
  GET_ACTIVE_ORDERS_FAIL: `${prefix}/GET_ACTIVE_ORDERS_FAIL`,
  GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_SUCCESS:
    `${prefix}/GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_SUCCESS`,
  GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_FAIL:
    `${prefix}/GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_FAIL`,

  GET_READY_ORDERS_REQUEST: `${prefix}/GET_READY_ORDERS_REQUEST`,
  GET_READY_ORDERS_SUCCESS: `${prefix}/GET_READY_ORDERS_SUCCESS`,
  GET_READY_ORDERS_FAIL: `${prefix}/GET_READY_ORDERS_FAIL`,
  GET_READY_ORDERS_TAKER_GEOLOCATION_SUCCESS:
    `${prefix}/GET_READY_ORDERS_TAKER_GEOLOCATION_SUCCESS`,
  GET_READY_ORDERS_TAKER_GEOLOCATION_FAIL:
    `${prefix}/GET_READY_ORDERS_TAKER_GEOLOCATION_FAIL`,

  GET_HISTORY_ORDERS_REQUEST: `${prefix}/GET_HISTORY_ORDERS_REQUEST`,
  GET_HISTORY_ORDERS_SUCCESS: `${prefix}/GET_HISTORY_ORDERS_SUCCESS`,
  GET_HISTORY_ORDERS_FAIL: `${prefix}/GET_HISTORY_ORDERS_FAIL`,
  GET_HISTORY_ORDERS_TAKER_GEOLOCATION_SUCCESS:
    `${prefix}/GET_HISTORY_ORDERS_TAKER_GEOLOCATION_SUCCESS`,
  GET_HISTORY_ORDERS_TAKER_GEOLOCATION_FAIL:
    `${prefix}/GET_HISTORY_ORDERS_TAKER_GEOLOCATION_FAIL`,

  WATCH_ORDER: `${prefix}/WATCH_ORDER`,
  UNWATCH_ORDER: `${prefix}/UNWATCH_ORDER`,
  GET_ORDER_REQUEST: `${prefix}/GET_ORDER_REQUEST`,
  GET_ORDER_SUCCESS: `${prefix}/GET_ORDER_SUCCESS`,
  GET_ORDER_FAIL: `${prefix}/GET_ORDER_FAIL`,
  START_MUTATION: `${prefix}/START_MUTATION`,
  END_MUTATION: `${prefix}/END_MUTATION`,

  CLEAR: `${prefix}/CLEAR`,
} as const

export interface IOrderState {
  value: IOrder | null
  partial: IOrder | null
  listeners: number
  mutations: number
  stale: boolean
}

export interface IOrdersState {
  orders: ImmutableMap<IOrder['b_id'], RecordOf<IOrderState>>
  activeOrders: IOrder[] | null
  readyOrders: IOrder[] | null
  historyOrders: IOrder[] | null
  activeOrdersTakerGeolocation?: [lat: number, lng: number]
  readyOrdersTakerGeolocation?: [lat: number, lng: number]
  historyOrdersTakerGeolocation?: [lat: number, lng: number]
}