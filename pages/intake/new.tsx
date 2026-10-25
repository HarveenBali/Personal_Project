import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitChangeRequest } from '../../api/intake.api';
import { isDemoMode } from '../../config/api.config';
import { DynamicFieldRenderer } from '../../components/intake/DynamicFieldRenderer';
import {
  setCurrentStep,
  setFormData,
  setIsSubmitting,
  setSchema,
} from '../../features/intake/intakeSlice';
import { setRecords } from '../../features/reporting/reportingSlice';
import { useSecureDraft } from '../../hooks/useSecureDraft';
import type { AppDispatch, RootState } from '../../store';
import type {
  DynamicFormField as SchemaField,
  DynamicFormSchema,
} from '../../types/schema.types';

const WorkflowCanvas = dynamic(
  () =>
    import('../../components/intake/WorkflowCanvas').then(
      (module) => module.WorkflowCanvas,
    ),
  { ssr: false, loading: () => <p>Loading approval workflow…</p> },
);

const intakeValidationSchema = z.object({
  title: z.string().trim().min(1, 'Enter a request title.'),
  category: z.enum(['Application', 'Infrastructure', 'Security']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  justification: z
    .string()
    .refine(
      (value) => value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0,
      'Enter a business justification.',
    ),
  slaDueDate: z.string().min(1, 'Choose a target date.'),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative.'),
});

type IntakeValues = z.infer<typeof intakeValidationSchema>;
type IntakeField = Omit<SchemaField, 'name'> & { name: Path<IntakeValues> };
type IntakeStep = Omit<DynamicFormSchema, 'fields'> & { fields: IntakeField[] };

const intakeSchema: IntakeStep[] = [
  {
    stepId: 'request',
    stepTitle: 'Change request',
    fields: [
      {
        id: 'title',
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        placeholder: 'Briefly describe the change',
      },
      {
        id: 'category',
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: [
          { label: 'Application', value: 'Application' },
          { label: 'Infrastructure', value: 'Infrastructure' },
          { label: 'Security', value: 'Security' },
        ],
      },
      {
        id: 'priority',
        name: 'priority',
        label: 'Priority',
        type: 'select',
        required: true,
        options: [
          { label: 'Low', value: 'LOW' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'High', value: 'HIGH' },
          { label: 'Critical', value: 'CRITICAL' },
        ],
      },
    ],
  },
  {
    stepId: 'justification',
    stepTitle: 'Justification and schedule',
    fields: [
      {
        id: 'justification',
        name: 'justification',
        label: 'Business justification',
        type: 'richtext',
        required: true,
      },
      {
        id: 'slaDueDate',
        name: 'slaDueDate',
        label: 'Target date',
        type: 'date',
        required: true,
      },
      {
        id: 'estimatedCost',
        name: 'estimatedCost',
        label: 'Estimated cost',
        type: 'number',
        validation: { min: 0 },
      },
    ],
  },
];

export default function NewIntakePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentStep, isSubmitting } = useSelector((state: RootState) => state.intake);
  const existingRecords = useSelector((state: RootState) => state.reporting.records);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const schema = useMemo(() => intakeSchema, []);
  const { control, register, handleSubmit, reset, watch, trigger } = useForm<IntakeValues>({
    resolver: zodResolver(intakeValidationSchema),
    defaultValues: {
      title: '',
      category: 'Application',
      priority: 'MEDIUM',
      justification: '',
      slaDueDate: '',
      estimatedCost: 0,
    },
  });
  const values = watch();
  const { restoreDraft, clearDraft } = useSecureDraft('change-request-intake', values);

  useEffect(() => {
    dispatch(setSchema(schema));
    const draft = restoreDraft();
    if (draft) {
      const parsedDraft = intakeValidationSchema.safeParse(draft);
      if (parsedDraft.success) {
        reset(parsedDraft.data);
        dispatch(setFormData({ ...parsedDraft.data }));
      } else {
        setFormError('A saved draft could not be validated. Review and correct the form.');
      }
    }
  }, [dispatch, reset, restoreDraft, schema]);

  const activeStep = schema[currentStep];
  const priority =
    typeof values.priority === 'string' && values.priority
      ? values.priority
      : 'MEDIUM';

  const onSubmit = async (formData: IntakeValues) => {
    setFormError(null);
    setSubmittedMessage(null);
    dispatch(setIsSubmitting(true));
    dispatch(setFormData({ ...formData }));

    try {
      const record = await submitChangeRequest({
        ...formData,
        requestedBy: 'Current user',
        createdAt: new Date().toISOString(),
        status: 'SUBMITTED',
      });
      dispatch(setRecords([...existingRecords, record]));
      clearDraft();
      setSubmittedMessage('Change request submitted successfully.');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to submit the change request.',
      );
    } finally {
      dispatch(setIsSubmitting(false));
    }
  };

  const goToNextStep = async () => {
    if (!activeStep) return;
    const isStepValid = await trigger(activeStep.fields.map((field) => field.name));
    if (isStepValid) {
      dispatch(setCurrentStep(currentStep + 1));
    }
  };

  return (
    <section>
      <h1>New change request</h1>
      {isDemoMode && (
        <p role="status">
          Demo mode: submissions are saved in this browser and do not reach a backend.
        </p>
      )}
      <WorkflowCanvas priority={priority} />
      {activeStep && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <fieldset disabled={Boolean(submittedMessage)}>
            <h2>
              Step {currentStep + 1} of {schema.length}: {activeStep.stepTitle}
            </h2>
            {activeStep.fields.map((field) => (
              <DynamicFieldRenderer
                key={field.id}
                field={field}
                control={control}
                register={register}
              />
            ))}
            <div>
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => dispatch(setCurrentStep(currentStep - 1))}
              >
                Previous
              </button>
              {currentStep < schema.length - 1 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                >
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting}>
                  {submittedMessage
                    ? 'Submitted'
                    : isSubmitting
                      ? 'Submitting…'
                      : 'Submit request'}
                </button>
              )}
            </div>
          </fieldset>
        </form>
      )}
      {formError && <p role="alert">{formError}</p>}
      {submittedMessage && <p role="status">{submittedMessage}</p>}
    </section>
  );
}
