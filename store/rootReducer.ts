import { combineReducers } from '@reduxjs/toolkit';
import { intakeReducer } from '../features/intake/intakeSlice';
import { reportingReducer } from '../features/reporting/reportingSlice';

export const rootReducer = combineReducers({
  intake: intakeReducer,
  reporting: reportingReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
