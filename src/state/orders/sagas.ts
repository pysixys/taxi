import { all, race, fork, take, put } from 'redux-saga/effects'
import moment from 'moment'
import { TAction } from '../../types'
import { EUserRoles, EOrderTypes, IOrder } from '../../types/types'
import SITE_CONSTANTS from '../../siteConstants'
import { getCurrentPosition } from '../../tools/utils'
import { select, call, concurrency } from '../../tools/sagaUtils'
import { updateCompletedOrderDuration } from '../../tools/order'
import * as API from '../../API'
import { IRootState } from '..'
import { user } from '../user/selectors'
import { getUserCars } from '../cars/actionCreators'
import { setSelectedOrder } from '../clientOrder/actionCreators'
import { getAreasBetweenPoints } from '../areas/actionCreators'
import { ActionTypes } from './constants'
import { getOrder } from './actionCreators'
import {
  moduleSelector,
  activeOrders, readyOrders, historyOrders,
} from './selectors'

export const saga = function* () {
  yield all([
    concurrency({
      action: ActionTypes.GET_ACTIVE_ORDERS_REQUEST,
      saga: getOrdersGroupSaga,
      parallelKey: 0,
      sequenceKey: {},
      leading: true,
    }, {
      action: ActionTypes.GET_READY_ORDERS_REQUEST,
      saga: getOrdersGroupSaga,
      parallelKey: 0,
      sequenceKey: {},
      leading: true,
    }, {
      action: ActionTypes.GET_HISTORY_ORDERS_REQUEST,
      saga: getOrdersGroupSaga,
      parallelKey: 0,
      sequenceKey: {},
      leading: true,
    }, {
      action: [
        ActionTypes.WATCH_ORDER,
        ActionTypes.GET_ORDER_REQUEST,
        ActionTypes.END_MUTATION,
      ],
      saga: getOrderByIdSaga,
      parallelKey: 1,
      sequenceKey: ({ payload }: TAction) => payload,
      leading: ({ type, payload }: TAction) =>
        type !== ActionTypes.END_MUTATION ? payload : undefined,
      latest: ({ type, payload }: TAction) =>
        type === ActionTypes.END_MUTATION ? payload : undefined,
    }),
  ])
}

function* getOrdersGroupSaga({ type, payload: { estimate } }: TAction) {
  const {
    successAction, failAction, geolocationSuccessAction, geolocationFailAction,
    prevSelector, ordersType,
  } = ({
    [ActionTypes.GET_ACTIVE_ORDERS_REQUEST]: {
      successAction: ActionTypes.GET_ACTIVE_ORDERS_SUCCESS,
      failAction: ActionTypes.GET_ACTIVE_ORDERS_FAIL,
      geolocationSuccessAction:
        ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_SUCCESS,
      geolocationFailAction:
        ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_FAIL,
      prevSelector: activeOrders,
      ordersType: EOrderTypes.Active,
    },
    [ActionTypes.GET_READY_ORDERS_REQUEST]: {
      successAction: ActionTypes.GET_READY_ORDERS_SUCCESS,
      failAction: ActionTypes.GET_READY_ORDERS_FAIL,
      geolocationSuccessAction:
        ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_SUCCESS,
      geolocationFailAction:
        ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_FAIL,
      prevSelector: readyOrders,
      ordersType: EOrderTypes.Ready,
    },
    [ActionTypes.GET_HISTORY_ORDERS_REQUEST]: {
      successAction: ActionTypes.GET_HISTORY_ORDERS_SUCCESS,
      failAction: ActionTypes.GET_HISTORY_ORDERS_FAIL,
      geolocationSuccessAction:
        ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_SUCCESS,
      geolocationFailAction:
        ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_FAIL,
      prevSelector: historyOrders,
      ordersType: EOrderTypes.History,
    },
  } as const)[type]!

  const prev = (yield* select(prevSelector)) ?? []
  try {
    let orders = yield* getOrdersSaga(ordersType)

    if (type === ActionTypes.GET_ACTIVE_ORDERS_REQUEST) {
      orders = yield* cancelExpiredOrdersSaga(orders)
      if (orders.length === 1)
        yield put(setSelectedOrder(orders[0].b_id))
      if (orders.length === 0)
        yield put(setSelectedOrder(null))
    }
    yield put({ type: successAction, payload: orders })

    try {
      const geolocation = estimate ?
        yield* getOrdersTakerGeolocationSaga(orders) :
        undefined
      if (geolocation)
        yield put({ type: geolocationSuccessAction, payload: geolocation })
    } catch (error) {
      yield put({ type: geolocationFailAction, payload: error })
    }

    if (type === ActionTypes.GET_ACTIVE_ORDERS_REQUEST)
      yield fork(function*() {
        while (orders.length > 0) {
          const [keptOrders] = yield race([
            call(cancelOrdersOnNextExpireSaga, orders),
            take(ActionTypes.GET_ACTIVE_ORDERS_REQUEST),
          ])
          if (!keptOrders)
            break
          orders = keptOrders
          yield put({ type: successAction, payload: orders })
        }
      })

    yield* afterOrdersChangeSaga(prev, orders)
  }

  catch (error) {
    console.error(error)
    yield put({ type: failAction, payload: error })
  }
}

function* getOrderByIdSaga({ payload }: TAction) {
  if (yield* select((state: IRootState) =>
    !moduleSelector(state).orders.get(payload)?.mutations,
  )) yield* getOrderSaga(payload)
}

function* getOrdersSaga(
  orderType: EOrderTypes,
): Generator<any, IOrder[], any> {
  const userID = (yield* select(user))?.u_id
  if (!userID) throw new Error()

  const orders = yield* call(API.getOrders, orderType)
  return orders.map(updateCompletedOrderDuration)
}

function* getOrderSaga(id: IOrder['b_id']) {
  try {
    const order = yield* call(API.getOrder, id)
    if (!order)
      return
    yield put({ type: ActionTypes.GET_ORDER_SUCCESS, payload: order })
  } catch (error) {
    yield put({ type: ActionTypes.GET_ORDER_FAIL, payload: { id, error } })
  }
}

function* afterOrdersChangeSaga(prev: IOrder[], current: IOrder[]) {
  const currentIds = new Set(current.map(order => order.b_id))
  const diff = prev.filter(order => !currentIds.has(order.b_id))

  const existing =
    yield* select((state: IRootState) => moduleSelector(state).orders)
  for (const order of diff)
    if (existing.has(order.b_id))
      yield put(getOrder(order.b_id))
}

function* cancelOrdersOnNextExpireSaga(orders: IOrder[]) {
  const nextCancel = orders.reduce((value, order) =>
    order.b_voting &&
    order.b_start_datetime ?
      Math.min(
        +order.b_start_datetime +
          (order.b_max_waiting || SITE_CONSTANTS.WAITING_INTERVAL),
        value,
      ) :
      value
  , Infinity) * 1000 - +moment()
  if (nextCancel === Infinity)
    return null
  yield call(() => new Promise(resolve => setTimeout(resolve, nextCancel)))
  return yield* cancelExpiredOrdersSaga(orders)
}

function* cancelExpiredOrdersSaga(orders: IOrder[]) {
  const currentUser = yield* select(user)
  if (!currentUser || currentUser.u_role !== EUserRoles.Client)
    return orders

  const ordersToCancel: IOrder[] = []
  const keptOrders: IOrder[] = []
  for (const order of orders)
    (
      (
        order.b_voting &&
        order.b_start_datetime &&
        (order.b_max_waiting || SITE_CONSTANTS.WAITING_INTERVAL) <=
          moment().diff(order.b_start_datetime, 'seconds')
      ) ?
        ordersToCancel :
        keptOrders
    ).push(order)

  yield fork(function*() {
    for (const order of ordersToCancel) {
      try {
        yield* call(API.cancelDrive, order.b_id)
      } catch (error) {
        console.error(error)
      }
    }
  })

  return keptOrders
}

function* getOrdersTakerGeolocationSaga(
  orders: IOrder[],
): Generator<any, [lat: number, lng: number] | undefined, any> {
  if (orders.length > 0) {
    const position = yield* call(getCurrentPosition)
    const { latitude, longitude } = position.coords
    const geolocation: [number, number] = [latitude, longitude]

    yield put(getAreasBetweenPoints([
      ...orders
        .flatMap(order => [
          [order.b_start_latitude, order.b_start_longitude],
          [order.b_destination_latitude, order.b_destination_longitude],
        ])
        .filter(([lat, lng]) => lat && lng) as [number, number][],
      geolocation,
    ]))
    yield put(getUserCars())

    return geolocation
  }
}