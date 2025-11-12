import { ICar } from '../../types/types'
import * as API from '../../API'
import { IDispatch } from '..'
import { ActionTypes } from './constants'

export const getUserCars = () => ({ type: ActionTypes.GET_USER_CARS_REQUEST })

export const createUserCar = (
  ...params: Parameters<typeof API.createUserCar>
) => async(dispatch: IDispatch) => {
  const response = await API.createUserCar(...params)
  if (response.code === '200')
    dispatch({
      type: ActionTypes.CREATE_USER_CAR_SUCCESS,
      payload: response.data.created_car.c_id,
    })
  return response
}

export const edit = (
  id: ICar['c_id'],
  ...params: Parameters<
    typeof API.editCar
  > extends [any, ...infer Rest] ? Rest : never
) => mutationThunk(() => API.editCar(id, ...params), id)
export const drive = (car: ICar) =>
  mutationThunk(() => API.driveCar(car), car.c_id)

const mutationThunk = <TReturn>(
  mutation: () => Promise<TReturn>,
  id: ICar['c_id'],
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