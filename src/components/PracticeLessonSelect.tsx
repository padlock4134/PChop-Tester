import React from 'react';

export interface PracticeLesson {
  id: string;
  title: string;
}

export interface PracticeLessonCourse {
  id: string;
  title: string;
  lessons: PracticeLesson[];
}

interface PracticeLessonSelectProps {
  value: string;
  onChange: (lessonId: string) => void;
  courses?: PracticeLessonCourse[];
  className?: string;
  placeholder?: string;
  emptyMessage?: string;
}

interface PracticeLessonHistorySelectProps {
  selectedLessonId: string;
  courses?: PracticeLessonCourse[];
  className?: string;
  label?: string;
  emptyMessage?: string;
}

export const getPracticeLessonTitle = (courses: PracticeLessonCourse[] = [], lessonId: string): string => {
  for (const course of courses) {
    const lesson = course.lessons.find((item) => item.id === lessonId);
    if (lesson) return lesson.title;
  }

  return '';
};

const PracticeLessonSelect: React.FC<PracticeLessonSelectProps> = ({
  value,
  onChange,
  courses = [],
  className,
  placeholder = 'Choose a lesson...',
  emptyMessage = 'No lessons available. Upload or assign curriculum first.',
}) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={className}
  >
    <option value="">{placeholder}</option>
    {courses.length > 0 ? (
      courses.map((course) => (
        <optgroup key={course.id} label={course.title}>
          {course.lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
          ))}
        </optgroup>
      ))
    ) : (
      <option value="" disabled>{emptyMessage}</option>
    )}
  </select>
);

export const PracticeLessonHistorySelect: React.FC<PracticeLessonHistorySelectProps> = ({
  selectedLessonId,
  courses = [],
  className,
  label = 'Lessons Practiced',
  emptyMessage = 'No lesson selected',
}) => {
  const selectedLessonTitle = getPracticeLessonTitle(courses, selectedLessonId);

  return (
    <select className={className} value={selectedLessonId || ''} disabled>
      <option value="" disabled>{label}</option>
      {selectedLessonTitle ? (
        <option value={selectedLessonId}>{selectedLessonTitle}</option>
      ) : (
        <option value="no-lesson" disabled>{emptyMessage}</option>
      )}
    </select>
  );
};

export default PracticeLessonSelect;
