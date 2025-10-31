import { all, put } from 'redux-saga/effects'
import { TAction } from '../../types'
import { IUser } from '../../types/types'
import { select, call, concurrency } from '../../tools/sagaUtils'
import * as API from '../../API'
import { user as userSelector } from '../user/selectors'
import { ActionTypes } from './constants'
import { carMutates as carMutatesSelector } from './selectors'

export function* saga() {
  const loadState: LoadState = {}
  yield all([
    concurrency({
      action: ActionTypes.GET_USER_CARS_REQUEST,
      saga: (action: TAction) => getUserCarsSaga(action, loadState),
      parallelKey: 0,
      leading: true,
    }, {
      action: ActionTypes.END_MUTATION,
      saga: getCarSaga,
      parallelKey: 1,
      sequenceKey: ({ payload }: TAction) => payload,
      latest: ({ payload }: TAction) => payload,
    }),
  ])
}

interface LoadState {
  lastUser?: IUser
}

function* getCarSaga({ type, payload }: TAction) {
  if (yield* select(carMutatesSelector, payload))
    return
  try {
    const car = yield* call(API.getCar, payload)
    if (car)
      yield put({ type: ActionTypes.GET_SUCCESS, payload: car })
    else
      yield put({ type: ActionTypes.GET_NOT_FOUND, payload })
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GET_FAIL, payload: error })
  }
}

function* getUserCarsSaga(_: TAction, loadState: LoadState) {
  const user = yield* select(userSelector)
  if (!user || user === loadState.lastUser)
    return
  try {
    const cars = yield* call(API.getUserCars)
    yield put({ type: ActionTypes.GET_USER_CARS_SUCCESS, payload: cars })
    loadState.lastUser = user
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GET_USER_CARS_FAIL, payload: error })
  }
}