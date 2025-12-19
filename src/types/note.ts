export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  taskId?: string; // Link to task if created from task
  createdAt: string;
  updatedAt: string;
}

export const NOTE_COLORS = [
  'hsl(262, 80%, 55%)', // purple (primary for notes)
  'hsl(45, 90%, 50%)',  // yellow
  'hsl(168, 80%, 40%)', // teal
  'hsl(35, 95%, 55%)',  // orange
  'hsl(200, 80%, 50%)', // blue
  'hsl(145, 70%, 45%)', // green
  'hsl(340, 80%, 55%)', // pink
  'hsl(0, 70%, 55%)',   // red
];
