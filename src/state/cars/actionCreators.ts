import { ICar } from '../../types/types'
import * as API from '../../API'
import { IDispatch } from '..'
import { ActionTypes } from './constants'

export const getUserCars = () => ({ type: ActionTypes.GET_USER_CARS_REQUEST })

export const editCar = (
  id: ICar['c_id'],
  ...params: Parameters<
    typeof API.editCar
  > extends [any, ...infer Rest] ? Rest : never
) => async(dispatch: IDispatch) => {
  dispatch({ type: ActionTypes.START_MUTATION, payload: id })
  try {
    return await API.editCar(id, ...params)
  } finally {
    dispatch({ type: ActionTypes.END_MUTATION, payload: id })
  }
}