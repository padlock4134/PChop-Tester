import { useEffect, useState } from 'react';

export interface CurriculumSyllabusLesson {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
}

export interface CurriculumSyllabusCourse {
  id: string;
  title: string;
  lessons: CurriculumSyllabusLesson[];
}

export interface CurriculumSyllabusData {
  title: string;
  courses: CurriculumSyllabusCourse[];
}

type SupabaseQuery = {
  select: (columns: string) => SupabaseQuery;
  order: (column: string, options?: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }>;
  in: (column: string, values: string[]) => SupabaseQuery;
};

type SupabaseClientLike = {
  from: (table: string) => SupabaseQuery;
};

const EMPTY_SYLLABUS: CurriculumSyllabusData = {
  title: '',
  courses: [],
};

const getMetadata = (row: any) => row?.ai_suggestion?.metadata || row?.metadata || {};

const getLessonTitle = (row: any) => {
  const metadata = getMetadata(row);
  return row?.title || metadata.title || row?.file_name || 'Untitled Lesson';
};

const getWeekNumber = (row: any) => {
  const metadata = getMetadata(row);
  const value = row?.week_number || metadata.weekNumber || metadata.week_number;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getCourseTitle = (row: any, weekNumber: number | null) => {
  const metadata = getMetadata(row);
  return row?.course_title || row?.unit_title || metadata.courseTitle || metadata.unitTitle || metadata.termTitle || (weekNumber ? `Term ${weekNumber <= 8 ? 1 : 2}` : 'Curriculum');
};

const getCourseId = (courseTitle: string, weekNumber: number | null) => {
  if (weekNumber) return `term-${weekNumber <= 8 ? 1 : 2}`;
  return courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'curriculum';
};

const toCourses = (items: any[]): CurriculumSyllabusCourse[] => {
  const courseMap = new Map<string, CurriculumSyllabusCourse>();

  items.forEach((item, index) => {
    const weekNumber = getWeekNumber(item);
    const courseTitle = getCourseTitle(item, weekNumber);
    const courseId = getCourseId(courseTitle, weekNumber);

    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        id: courseId,
        title: courseTitle,
        lessons: [],
      });
    }

    courseMap.get(courseId)?.lessons.push({
      id: String(item?.id || `curriculum-lesson-${index}`),
      title: getLessonTitle(item),
      completed: false,
      current: index === 0,
    });
  });

  return Array.from(courseMap.values());
};

export const fetchCurriculumSyllabus = async (supabase: SupabaseClientLike): Promise<CurriculumSyllabusData> => {
  let items: any[] = [];

  const { data: curriculumData, error: curriculumError } = await supabase
    .from('curriculum_content')
    .select('*')
    .order('week_number', { ascending: true, nullsFirst: false });

  if (!curriculumError && curriculumData && curriculumData.length > 0) {
    items = curriculumData as any[];
  } else {
    const { data: stagingData, error: stagingError } = await supabase
      .from('content_staging')
      .select('*')
      .in('status', ['distributed', 'pending', 'draft'])
      .order('created_at', { ascending: true });

    if (!stagingError && stagingData && stagingData.length > 0) {
      items = stagingData as any[];
    }
  }

  if (items.length === 0) return EMPTY_SYLLABUS;

  return {
    title: '',
    courses: toCourses(items),
  };
};

export const useCurriculumSyllabus = (supabase: SupabaseClientLike): CurriculumSyllabusData => {
  const [syllabusData, setSyllabusData] = useState<CurriculumSyllabusData>(EMPTY_SYLLABUS);

  useEffect(() => {
    let active = true;

    const loadCurriculum = async () => {
      try {
        const data = await fetchCurriculumSyllabus(supabase);
        if (active) setSyllabusData(data);
      } catch (error) {
        console.error('Failed to load curriculum:', error);
        if (active) setSyllabusData(EMPTY_SYLLABUS);
      }
    };

    loadCurriculum();

    return () => {
      active = false;
    };
  }, [supabase]);

  return syllabusData;
};
