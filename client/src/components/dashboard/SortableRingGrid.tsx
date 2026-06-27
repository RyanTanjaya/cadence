import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { Habit } from '../../types';
import HabitCard from './HabitCard';

interface Props {
  habits: Habit[];
  date: Date;
  onToggle: (id: string) => void;
  onReorder: (habits: Habit[]) => void;
}

function SortableCard({ habit, date, onToggle }: { habit: Habit; date: Date; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
    touchAction: 'none',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <HabitCard habit={habit} date={date} onToggle={onToggle} />
    </div>
  );
}

export default function SortableRingGrid({ habits, date, onToggle, onReorder }: Props) {
  // An 8px drag threshold lets a plain tap still toggle the ring.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex((h) => h.id === active.id);
      const newIndex = habits.findIndex((h) => h.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(habits, oldIndex, newIndex));
      }
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={habits.map((h) => h.id)} strategy={rectSortingStrategy}>
        <motion.div className="ring-grid" layout>
          {habits.map((habit) => (
            <SortableCard
              key={habit.id}
              habit={habit}
              date={date}
              onToggle={() => onToggle(habit.id)}
            />
          ))}
        </motion.div>
      </SortableContext>
    </DndContext>
  );
}
