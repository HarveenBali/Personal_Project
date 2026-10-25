'use client';

import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
} from 'reactflow';

const stages = [
  'Requester',
  'Manager',
  'Tech Lead',
  'CAB Approval',
] as const;

interface WorkflowCanvasProps {
  priority: string;
}

function getCurrentStage(priority: string): number {
  switch (priority.trim().toLowerCase()) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
    case 'critical':
      return 3;
    default:
      return 0;
  }
}

export function WorkflowCanvas({ priority }: WorkflowCanvasProps) {
  const currentStage = getCurrentStage(priority);
  const nodes = useMemo<Node[]>(
    () =>
      stages.map((stage, index) => {
        const isCurrent = index === currentStage;
        const isComplete = index < currentStage;

        return {
          id: `stage-${index}`,
          position: { x: index * 220, y: 80 },
          data: {
            label: (
              <div
                style={{
                  display: 'grid',
                  gap: 4,
                  minWidth: 130,
                  textAlign: 'center',
                }}
              >
                <strong>{stage}</strong>
                <span>
                  {isCurrent ? 'Current stage' : isComplete ? 'Complete' : 'Pending'}
                </span>
              </div>
            ),
          },
          style: {
            border: isCurrent
              ? '3px solid #2563eb'
              : isComplete
                ? '2px solid #16a34a'
                : '1px solid #94a3b8',
            borderRadius: 8,
            background: isCurrent ? '#eff6ff' : isComplete ? '#f0fdf4' : '#fff',
            color: '#0f172a',
            padding: 12,
            width: 170,
            boxShadow: isCurrent ? '0 0 0 3px rgb(37 99 235 / 15%)' : undefined,
          },
          ariaLabel: `${stage}, ${isCurrent ? 'current stage' : isComplete ? 'complete' : 'pending'}`,
        };
      }),
    [currentStage],
  );
  const edges = useMemo<Edge[]>(
    () =>
      stages.slice(0, -1).map((_, index) => ({
        id: `edge-${index}-${index + 1}`,
        source: `stage-${index}`,
        target: `stage-${index + 1}`,
        animated: index < currentStage,
        style: {
          stroke: index < currentStage ? '#16a34a' : '#94a3b8',
          strokeWidth: 2,
        },
      })),
    [currentStage],
  );

  return (
    <section aria-label={`Approval workflow for ${priority} priority`}>
      <p>
        Priority: <strong>{priority}</strong>
      </p>
      <div style={{ height: 220, width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          aria-label="Four-stage approval workflow"
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  );
}
