import { Record as ImmutableRecord, Map as ImmutableMap } from 'immutable'
import _ from 'lodash'
import { TAction } from '../../types'
import { IOrder } from '../../types/types'
import { calculateDistance } from '../../tools/maps'
import { ActionTypes, IOrderState, IOrdersState } from './constants'

const OrderRecord = ImmutableRecord<IOrderState>({
  value: null,
  partial: null,
  listeners: 0,
  mutations: 0,
  stale: false,
})

const defaultRecord: IOrdersState = {
  orders: ImmutableMap(),
  activeOrders: null,
  readyOrders: null,
  historyOrders: null,
  activeOrdersTakerGeolocation: undefined,
  readyOrdersTakerGeolocation: undefined,
  historyOrdersTakerGeolocation: undefined,
}

export const ReducerRecord = ImmutableRecord<IOrdersState>(defaultRecord)

export default function(
  state = new ReducerRecord(),
  { type, payload }: TAction,
) {
  switch (type) {

    case ActionTypes.WATCH_ORDER:
    case ActionTypes.START_MUTATION: {
      return state
        .set('orders', state.orders
          .update(payload, new OrderRecord(), value => value
            .update(
              type === ActionTypes.START_MUTATION ? 'mutations' : 'listeners',
              value => value + 1,
            )
            .set(
              'stale',
              type === ActionTypes.START_MUTATION ? true : value.stale,
            ),
          ),
        )
    }
    case ActionTypes.UNWATCH_ORDER:
    case ActionTypes.END_MUTATION: {
      const orderData = state.orders.get(payload)!
        .update(
          type === ActionTypes.END_MUTATION ? 'mutations' : 'listeners',
          value => value - 1,
        )
      return state
        .set('orders', orderData.listeners > 0 || orderData.mutations > 0 ?
          state.orders
            .set(payload, orderData) :
          state.orders
            .delete(payload),
        )
    }

    case ActionTypes.GET_ORDER_SUCCESS: {
      return state
        .set('orders', state.orders
          .update(payload.b_id, value => value
            ?.update('value', value =>
              _.isEqual(payload, value) ? value : payload,
            )
            ?.set('stale', false),
          ),
        )
    }

    case ActionTypes.GET_ACTIVE_ORDERS_SUCCESS:
    case ActionTypes.GET_READY_ORDERS_SUCCESS:
    case ActionTypes.GET_HISTORY_ORDERS_SUCCESS: {
      const key = ({
        [ActionTypes.GET_ACTIVE_ORDERS_SUCCESS]: 'activeOrders',
        [ActionTypes.GET_READY_ORDERS_SUCCESS]: 'readyOrders',
        [ActionTypes.GET_HISTORY_ORDERS_SUCCESS]: 'historyOrders',
      } as const)[type]

      const toUnwatch = new Set(state[key]?.map(order => order.b_id))
      const toWatch: Record<IOrder['b_id'], number> = {}
      let changed = false
      const value: IOrder[] = []

      for (const order of payload) {
        const existing = state.orders.get(order.b_id)?.partial
        if (_.isEqual(order, existing))
          value.push(existing!)
        else {
          changed = true
          value.push(order)
        }
        if (toUnwatch.has(order.b_id))
          toUnwatch.delete(order.b_id)
        else
          toWatch[order.b_id] = 1
      }

      for (const id of toUnwatch)
        if (state.orders.get(id)!.listeners > 1) {
          toUnwatch.delete(id)
          toWatch[id] = -1
        }

      return changed || state[key]?.length !== value.length ?
        state
          .set(key, value)
          .set('orders', state.orders
            .deleteAll(toUnwatch)
            .mergeWith(
              (oldValue, newValue) => oldValue
                .set('partial', newValue.partial)
                .set('listeners', oldValue.listeners + newValue.listeners),
              value.map(order => [order.b_id, new OrderRecord({
                partial: order,
                listeners: toWatch[order.b_id],
              })]),
            ),
          ) :
        state
    }

    case ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_SUCCESS: {
      return geolocationEqual(state.activeOrdersTakerGeolocation, payload) ?
        state :
        state.set('activeOrdersTakerGeolocation', payload)
    }
    case ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_SUCCESS: {
      return geolocationEqual(state.readyOrdersTakerGeolocation, payload) ?
        state :
        state.set('readyOrdersTakerGeolocation', payload)
    }
    case ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_SUCCESS: {
      return geolocationEqual(state.historyOrdersTakerGeolocation, payload) ?
        state :
        state.set('historyOrdersTakerGeolocation', payload)
    }

    case ActionTypes.CLEAR: {
      const keys: (keyof IOrdersState)[] = [
        'activeOrders',
        'activeOrdersTakerGeolocation',
        'readyOrders',
        'readyOrdersTakerGeolocation',
        'historyOrders',
        'historyOrdersTakerGeolocation',
      ]
      for (const key of keys)
        state = state.set(key, defaultRecord[key])
      return state
        .set('orders', state.orders
          .map(orderData => orderData
            .set('value', null)
            .set('partial', null),
          ),
        )
    }

    default:
      return state

  }
}

const GEOLOCATION_CHANGE_THRESHOLD = 100
const geolocationEqual = (
  a?: [lat: number, lng: number],
  b?: [lat: number, lng: number],
): boolean => !!(
  a === b || (a && b && (
    (a[0] === b[0] && a[1] === b[1]) ||
    calculateDistance(a, b) < GEOLOCATION_CHANGE_THRESHOLD
  ))
)