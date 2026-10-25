'use client';

import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { setFilterGroup } from '../../features/reporting/reportingSlice';
import { FILTER_OPERATORS } from '../../constants/filterOperators';
import type {
  FilterCondition,
  FilterGroup,
  FilterOperator,
} from '../../types/reporting.types';

function isGroup(node: FilterCondition | FilterGroup): node is FilterGroup {
  return 'conditions' in node;
}

function makeCondition(fields: string[]): FilterCondition {
  return {
    id: crypto.randomUUID(),
    field: fields[0] ?? '',
    operator: 'contains',
    value: '',
  };
}

interface GroupEditorProps {
  group: FilterGroup;
  fields: string[];
  onChange: (group: FilterGroup) => void;
  onRemove?: () => void;
}

function GroupEditor({
  group,
  fields,
  onChange,
  onRemove,
}: GroupEditorProps) {
  const updateCondition = (
    index: number,
    condition: FilterCondition | FilterGroup,
  ) => {
    const conditions = [...group.conditions];
    conditions[index] = condition;
    onChange({ ...group, conditions });
  };

  return (
    <fieldset>
      <legend>Condition group</legend>
      <label>
        Match
        <select
          aria-label="Condition group operation"
          value={group.conjunction}
          onChange={(event) =>
            onChange({
              ...group,
              conjunction: event.target.value as FilterGroup['conjunction'],
            })
          }
        >
          <option value="AND">all conditions (AND)</option>
          <option value="OR">any condition (OR)</option>
        </select>
      </label>

      {group.conditions.map((node, index) =>
        isGroup(node) ? (
          <GroupEditor
            key={`group-${index}`}
            group={node}
            fields={fields}
            onChange={(updatedGroup) => updateCondition(index, updatedGroup)}
            onRemove={() =>
              onChange({
                ...group,
                conditions: group.conditions.filter((_, itemIndex) => itemIndex !== index),
              })
            }
          />
        ) : (
          <div key={node.id}>
            <label>
              Field
              <select
                value={node.field}
                onChange={(event) =>
                  updateCondition(index, { ...node, field: event.target.value })
                }
                disabled={fields.length === 0}
              >
                {fields.length === 0 ? (
                  <option value="">No record fields available</option>
                ) : (
                  fields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label>
              Operator
              <select
                value={node.operator}
                onChange={(event) => {
                  const operator = event.target.value as FilterOperator;
                  const isListValue = operator === 'in' || operator === 'between';
                  const needsNoValue =
                    operator === 'isEmpty' || operator === 'isNotEmpty';
                  const previousValue = Array.isArray(node.value)
                    ? node.value.join(', ')
                    : String(node.value ?? '');
                  updateCondition(index, {
                    ...node,
                    operator,
                    value: needsNoValue
                      ? ''
                      : isListValue
                        ? previousValue
                            .split(',')
                            .map((value) => value.trim())
                            .filter(Boolean)
                        : previousValue,
                  });
                }}
              >
                {FILTER_OPERATORS.map((operator) => (
                  <option key={operator.value} value={operator.value}>
                    {operator.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Value
              <input
                value={typeof node.value === 'string' ? node.value : String(node.value ?? '')}
                onChange={(event) =>
                  updateCondition(index, {
                    ...node,
                    value:
                      node.operator === 'in' || node.operator === 'between'
                        ? event.target.value.split(',').map((value) => value.trim())
                        : event.target.value,
                  })
                }
                placeholder={
                  node.operator === 'in' || node.operator === 'between'
                    ? 'Separate values with commas'
                    : undefined
                }
                disabled={node.operator === 'isEmpty' || node.operator === 'isNotEmpty'}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...group,
                  conditions: group.conditions.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            >
              Remove condition
            </button>
          </div>
        ),
      )}

      <button
        type="button"
        disabled={fields.length === 0}
        onClick={() =>
          onChange({
            ...group,
            conditions: [...group.conditions, makeCondition(fields)],
          })
        }
      >
        Add condition
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            ...group,
            conditions: [
              ...group.conditions,
              { conjunction: 'AND', conditions: [] },
            ],
          })
        }
      >
        Add group
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove}>
          Remove group
        </button>
      )}
    </fieldset>
  );
}

export function AdvancedFilterBuilder() {
  const dispatch = useDispatch<AppDispatch>();
  const { filterGroup, records } = useSelector(
    (state: RootState) => state.reporting,
  );
  const fields = useMemo(
    () => Array.from(new Set(records.flatMap((record) => Object.keys(record)))).sort(),
    [records],
  );

  return (
    <section aria-label="Advanced report filters">
      <GroupEditor
        group={filterGroup}
        fields={fields}
        onChange={(updatedGroup) => dispatch(setFilterGroup(updatedGroup))}
      />
    </section>
  );
}
