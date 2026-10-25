import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ChangeRequestRecord,
  FilterCondition,
  FilterGroup,
} from '../../types/reporting.types';

export type {
  ChangeRequestRecord,
  FilterCondition,
  FilterGroup,
  FilterOperator,
} from '../../types/reporting.types';

export type ReportingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ReportingState {
  records: ChangeRequestRecord[];
  filterGroup: FilterGroup;
  selectedRows: string[];
  columnVisibility: Record<string, boolean>;
  status: ReportingStatus;
}

const initialState: ReportingState = {
  records: [],
  filterGroup: { conjunction: 'AND', conditions: [] },
  selectedRows: [],
  columnVisibility: {},
  status: 'idle',
};

const reportingSlice = createSlice({
  name: 'reporting',
  initialState,
  reducers: {
    setRecords(state, action: PayloadAction<ChangeRequestRecord[]>) {
      state.records = action.payload;
    },
    setFilterGroup(state, action: PayloadAction<FilterGroup>) {
      state.filterGroup = action.payload;
    },
    setSelectedRows(state, action: PayloadAction<string[]>) {
      state.selectedRows = action.payload;
    },
    setColumnVisibility(
      state,
      action: PayloadAction<Record<string, boolean>>,
    ) {
      state.columnVisibility = action.payload;
    },
    setStatus(state, action: PayloadAction<ReportingStatus>) {
      state.status = action.payload;
    },
  },
});

export const {
  setRecords,
  setFilterGroup,
  setSelectedRows,
  setColumnVisibility,
  setStatus,
} = reportingSlice.actions;

export const reportingReducer = reportingSlice.reducer;
