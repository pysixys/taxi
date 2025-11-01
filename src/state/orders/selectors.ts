import { createSelector, weakMapMemoize } from 'reselect'
import { IOrder, ICar } from '../../types/types'
import { estimateOrder } from '../../tools/order'
import { IWayGraph } from '../../tools/maps'
import { IRootState } from '../'
import { userPrimaryCar } from '../cars/selectors'
import { wayGraph } from '../areas/selectors'
import { moduleName } from './constants'

export const moduleSelector = (state: IRootState) => state[moduleName]

const pureActiveOrders = createSelector(
  moduleSelector,
  state => state.activeOrders,
)
const pureReadyOrders = createSelector(
  moduleSelector,
  state => state.readyOrders,
)
const pureHistoryOrders = createSelector(
  moduleSelector,
  state => state.historyOrders,
)

const activeOrdersTakerGeolocation = createSelector(
  moduleSelector,
  state => state.activeOrdersTakerGeolocation,
)
const readyOrdersTakerGeolocation = createSelector(
  moduleSelector,
  state => state.readyOrdersTakerGeolocation,
)
const historyOrdersTakerGeolocation = createSelector(
  moduleSelector,
  state => state.historyOrdersTakerGeolocation,
)

const estimatedOrder = createSelector(
  [
    (order) => order,
    (_, geolocation) => geolocation,
    (_, __, car) => car,
    (_, __, ___, graph) => graph,
  ],
  (
    order: IOrder,
    geolocation: [number, number],
    car: ICar,
    graph: IWayGraph,
  ) => ({
    ...order,
    ...estimateOrder(order, car, geolocation, graph),
  }),
  { memoize: weakMapMemoize },
)
const estimatedOrders = (
  orders: IOrder[] | null,
  geolocation: [number, number] | undefined,
  car: ICar | null | undefined,
  graph: IWayGraph,
): IOrder[] | null =>
  orders && geolocation && car ?
    orders.map(order => estimatedOrder(order, geolocation, car, graph)) :
    orders
export const activeOrders = createSelector(
  [pureActiveOrders, activeOrdersTakerGeolocation, userPrimaryCar, wayGraph],
  estimatedOrders,
)
export const readyOrders = createSelector(
  [pureReadyOrders, readyOrdersTakerGeolocation, userPrimaryCar, wayGraph],
  estimatedOrders,
)
export const historyOrders = createSelector(
  [pureHistoryOrders, historyOrdersTakerGeolocation, userPrimaryCar, wayGraph],
  estimatedOrders,
)

const ordersData = (state: IRootState) => moduleSelector(state).orders
export const orders = createSelector(
  ordersData,
  orders => orders.map(order => order.value ?? order.partial).filter(Boolean),
  { memoizeOptions: {
    resultEqualityCheck: (oldValue, newValue) => newValue.equals(oldValue),
  } },
)
export function order(
  state: IRootState,
  id: IOrder['b_id'],
): IOrder | undefined {
  const orderData = ordersData(state).get(id)
  return orderData?.value ?? orderData?.partial ?? undefined
}

export const orderMutates = (state: IRootState, id: IOrder['b_id']) => {
  const orderData = ordersData(state).get(id)
  return !!(orderData?.mutations || orderData?.stale)
}