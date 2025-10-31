import { ICar } from '../../types/types'
import { ActionTypes } from './constants'

export const startMutation = (payload: ICar['c_id']) =>
  ({ type: ActionTypes.START_MUTATION, payload })
export const endMutation = (payload: ICar['c_id']) =>
  ({ type: ActionTypes.END_MUTATION, payload })
export const getUserCars = () => ({ type: ActionTypes.GET_USER_CARS_REQUEST })