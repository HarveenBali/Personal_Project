'use client';

import * as Select from '@radix-ui/react-select';
import {
  Controller,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from 'react-hook-form';
import type { DynamicFormField as SchemaField } from '../../types/schema.types';
import { TipTapEditor } from './TipTapEditor';

export type DynamicFormField<TValues extends FieldValues = FieldValues> =
  Omit<SchemaField, 'name' | 'type'> & {
    name: Path<TValues>;
    type: SchemaField['type'] | 'textarea' | 'checkbox';
  };

interface DynamicFieldRendererProps<TValues extends FieldValues> {
  field: DynamicFormField<TValues>;
  control: Control<TValues>;
  register: UseFormRegister<TValues>;
}

function getFieldValue(values: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || typeof value !== 'object') {
      return undefined;
    }

    return (value as Record<string, unknown>)[key];
  }, values);
}

function isVisible(rule: SchemaField['dependsOn'], values: unknown): boolean {
  if (!rule) return true;
  const actual = getFieldValue(values, rule.field);

  switch (rule.operator) {
    case 'equals':
      return actual === rule.value;
    case 'notEquals':
      return actual !== rule.value;
    case 'greaterThan':
      return Number(actual) > Number(rule.value);
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(actual);
  }
}

export function DynamicFieldRenderer<TValues extends FieldValues>({
  field,
  control,
  register,
}: DynamicFieldRendererProps<TValues>) {
  const values = useWatch({ control });

  if (!isVisible(field.dependsOn, values)) {
    return null;
  }

  if (field.type === 'multiselect') {
    return (
      <div>
        <label htmlFor={field.name}>{field.label}</label>
        <Controller
          control={control}
          name={field.name}
          rules={{ required: field.required }}
          render={({ field: controllerField }) => (
            <select
              id={field.name}
              multiple
              required={field.required}
              value={Array.isArray(controllerField.value) ? controllerField.value.map(String) : []}
              onBlur={controllerField.onBlur}
              onChange={(event) =>
                controllerField.onChange(
                  Array.from(event.currentTarget.selectedOptions, (option) => option.value),
                )
              }
              ref={controllerField.ref}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label htmlFor={field.name}>{field.label}</label>
        <Controller
          control={control}
          name={field.name}
          rules={{ required: field.required }}
          render={({ field: controllerField }) => (
            <Select.Root
              value={controllerField.value == null ? '' : String(controllerField.value)}
              onValueChange={controllerField.onChange}
              required={field.required}
            >
              <Select.Trigger
                id={field.name}
                aria-label={field.label}
                ref={controllerField.ref}
                onBlur={controllerField.onBlur}
              >
                <Select.Value placeholder={field.placeholder ?? 'Select an option'} />
                <Select.Icon aria-hidden="true">▾</Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content>
                  <Select.Viewport>
                    {field.options?.map((option) => (
                      <Select.Item key={option.value} value={String(option.value)}>
                        <Select.ItemText>{option.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          )}
        />
      </div>
    );
  }

  if (field.type === 'richtext') {
    return (
      <div>
        <label>{field.label}</label>
        <Controller
          control={control}
          name={field.name}
          rules={{ required: field.required }}
          render={({ field: controllerField }) => (
            <TipTapEditor
              value={typeof controllerField.value === 'string' ? controllerField.value : ''}
              onChange={controllerField.onChange}
              onBlur={controllerField.onBlur}
              ariaLabel={field.label}
            />
          )}
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label htmlFor={field.name}>{field.label}</label>
        <textarea
          id={field.name}
          placeholder={field.placeholder}
          required={field.required}
          {...register(field.name, { required: field.required })}
        />
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <div>
        <label htmlFor={field.name}>
          <input
            id={field.name}
            type="checkbox"
            required={field.required}
            {...register(field.name, { required: field.required })}
          />
          {field.label}
        </label>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={field.name}>{field.label}</label>
      <input
        id={field.name}
        type={field.type}
        placeholder={field.placeholder}
        required={field.required}
        {...register(field.name, {
          required: field.required,
          setValueAs:
            field.type === 'number'
              ? (value: string) => (value === '' ? undefined : Number(value))
              : undefined,
          min: field.validation?.min,
          max: field.validation?.max,
          pattern: field.validation?.regex
            ? new RegExp(field.validation.regex)
            : undefined,
        })}
      />
    </div>
  );
}
