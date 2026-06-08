import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

export interface SyllabusLesson {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
}

export interface SyllabusCourse {
  id: string;
  title: string;
  lessons: SyllabusLesson[];
}

interface SyllabusCardProps {
  title: string;
  courses: SyllabusCourse[];
  onLessonClick: (lessonId: string) => void;
  onDiagnosticBayClick?: () => void;
}

const SyllabusCard: React.FC<SyllabusCardProps> = ({ title, courses, onLessonClick, onDiagnosticBayClick }) => {
  const { t } = useTranslation();
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>(
    // Default to first course expanded
    courses.reduce((acc, course, index) => ({ ...acc, [course.id]: index === 0 }), {})
  );

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue overflow-hidden w-full h-full lg:min-h-[620px] flex flex-col">
      <div className="flex-shrink-0 p-4 bg-yellow-400 text-maineBlue font-retro">
        <h3 className="text-xl">✏️ {title}</h3>
      </div>
      
      {/* Diagnostic Bay Button */}
      <div className="flex-shrink-0 px-4 pt-4">
        <button
          onClick={onDiagnosticBayClick}
          className="w-full px-4 py-2 rounded border transition-colors bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 hover:text-amber-900"
        >
          🔧 {t('autoSchool.diagnosticBay.buttonLabel')}
        </button>
      </div>
      
      <div className="p-4 flex-1 min-h-0 overflow-y-auto">
        {courses.map(course => (
          <div key={course.id} className="mb-4 last:mb-0">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-sand p-2 rounded"
              onClick={() => toggleCourse(course.id)}
            >
              <h4 className="font-bold text-maineBlue">{course.title}</h4>
              <span className="text-sm text-gray-500">
                {expandedCourses[course.id] ? '▼' : '►'}
              </span>
            </div>
            
            {expandedCourses[course.id] && (
              <div className="ml-4 mt-2 border-l-2 border-gray-300 pl-4">
                {course.lessons.map(lesson => (
                  <div 
                    key={lesson.id}
                    className={`py-2 flex items-center cursor-pointer hover:bg-sand rounded px-2 ${
                      lesson.current ? 'bg-sand' : ''
                    }`}
                    onClick={() => onLessonClick(lesson.id)}
                  >
                    <div className="mr-2">
                      {lesson.completed ? (
                        <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <span className={`${lesson.current ? 'font-bold' : ''}`}>
                      {lesson.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyllabusCard;

