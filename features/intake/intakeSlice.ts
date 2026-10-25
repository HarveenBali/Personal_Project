import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DynamicFormSchema } from '../../types/schema.types';

export interface IntakeState {
  currentStep: number;
  schema: DynamicFormSchema[];
  formData: Record<string, unknown>;
  isSubmitting: boolean;
}

const initialState: IntakeState = {
  currentStep: 0,
  schema: [],
  formData: {},
  isSubmitting: false,
};

const intakeSlice = createSlice({
  name: 'intake',
  initialState,
  reducers: {
    setCurrentStep(state, action: PayloadAction<number>) {
      state.currentStep = Math.max(0, action.payload);
    },
    setSchema(state, action: PayloadAction<DynamicFormSchema[]>) {
      state.schema = action.payload;
      state.currentStep = Math.min(state.currentStep, Math.max(0, action.payload.length - 1));
    },
    setFormData(state, action: PayloadAction<Record<string, unknown>>) {
      state.formData = action.payload;
    },
    setIsSubmitting(state, action: PayloadAction<boolean>) {
      state.isSubmitting = action.payload;
    },
  },
});

export const { setCurrentStep, setSchema, setFormData, setIsSubmitting } =
  intakeSlice.actions;

export const intakeReducer = intakeSlice.reducer;
