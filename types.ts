
export enum ModuleId {
  TYPES = 'TYPES',
  INTERNAL_ANGLES = 'INTERNAL_ANGLES',
  EXTERNAL_ANGLES = 'EXTERNAL_ANGLES',
  MIDDLE_LINE = 'MIDDLE_LINE',
  CENTROID = 'CENTROID',
  ORTHOCENTER = 'ORTHOCENTER',
  CIRCUMCIRCLE = 'CIRCUMCIRCLE',
  INCIRCLE = 'INCIRCLE',
  EXISTENCE = 'EXISTENCE',
  SIDE_ANGLE_RELATION = 'SIDE_ANGLE_RELATION',
  FINAL_QUIZ = 'FINAL_QUIZ',
}

export enum SubModuleId {
  LESSON = 'LESSON',
  EXPLORE = 'EXPLORE',
  TEST = 'TEST',
}

export interface Point {
  x: number;
  y: number;
}

export interface TriangleState {
  A: Point;
  B: Point;
  C: Point;
}

export type QuestionType = 'MCQ' | 'DRAG_DROP' | 'INPUT';

export interface QuizItem {
  id: string;
  content: string; // SVG path d attribute OR text
  category: string; // The correct bucket ID
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  
  // MCQ Properties
  options?: string[];
  correctIndex?: number;
  explanation?: string; // Shown after completion

  // Drag & Drop Properties
  items?: QuizItem[];
  buckets?: string[]; // The labels for the boxes
  
  // Input / Text Properties & Hint System
  correctAnswer?: string; // For INPUT type
  hint?: string; // Shown after first wrong attempt
}

export interface LessonNode {
  id: string;
  title: string;
  content: string; // Supports basic HTML/KaTeX
  image?: string; // Placeholder URL or specific illustration
  children?: LessonNode[];
  parentId?: string;
}

export interface ModuleData {
  id: ModuleId;
  title: string;
  description: string;
  goals: string[]; // NEW: List of learning objectives
  icon: string;
  color: string;
  lessonRoot: LessonNode;
  quiz: QuizQuestion[];
}
