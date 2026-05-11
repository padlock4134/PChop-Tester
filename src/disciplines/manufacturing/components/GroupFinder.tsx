import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface GroupListing { id: string; lessonId: string; lessonTitle: string; courseName: string; leaderName: string; leaderInitials: string; currentMembers: number; maxMembers: number; note: string; minutesAgo: number; members: string[]; }

const MOCK_COURSES = [
  { id: 'course-1', title: 'Term 1: Manufacturing Foundations', lessons: [
    { id: 'lesson-1-1', title: 'Workplace Safety and Procedures' },
    { id: 'lesson-1-2', title: 'Material Handling and Storage' },
    { id: 'lesson-1-3', title: 'Introduction to Manufacturing Equipment' },
    { id: 'lesson-1-4', title: 'Basic Manufacturing Terminology' },
    { id: 'lesson-1-5', title: 'Measurements, Tolerances, and Conversions' },
  ]},
  { id: 'course-2', title: 'Term 1: Tool Skills', lessons: [
    { id: 'lesson-2-1', title: 'Tool Safety and Maintenance' },
    { id: 'lesson-2-2', title: 'Basic Tool Operations' },
    { id: 'lesson-2-3', title: 'Material Preparation' },
    { id: 'lesson-2-4', title: 'Component Fabrication' },
  ]},
  { id: 'course-3', title: 'Term 2: Assembly & Quality Control', lessons: [
    { id: 'lesson-3-1', title: 'Assembly Techniques' },
    { id: 'lesson-3-2', title: 'Production Line Setup' },
    { id: 'lesson-3-3', title: 'Quality Control Procedures' },
    { id: 'lesson-3-4', title: 'Inspection and Testing' },
  ]},
  { id: 'course-4', title: 'Term 2: Advanced Manufacturing', lessons: [
    { id: 'lesson-4-1', title: 'Process Automation' },
    { id: 'lesson-4-2', title: 'Lean Manufacturing' },
    { id: 'lesson-4-3', title: 'Six Sigma Methods' },
    { id: 'lesson-4-4', title: 'Advanced Quality Systems' },
  ]}
];

const MOCK_GROUPS: GroupListing[] = [
  { id: 'grp-1', lessonId: 'lesson-1-4', lessonTitle: 'Basic Manufacturing Terminology', courseName: 'Term 1: Manufacturing Foundations', leaderName: 'Marcus C.', leaderInitials: 'MC', currentMembers: 2, maxMembers: 4, note: 'Studying production vocab and acronyms!', minutesAgo: 3, members: ['Marcus C.', 'Sofia R.'] },
  { id: 'grp-2', lessonId: 'lesson-2-2', lessonTitle: 'Basic Tool Operations', courseName: 'Term 1: Tool Skills', leaderName: 'James L.', leaderInitials: 'JL', currentMembers: 1, maxMembers: 3, note: 'Need practice partners for lathe operations', minutesAgo: 8, members: ['James L.'] },
  { id: 'grp-3', lessonId: 'lesson-3-3', lessonTitle: 'Quality Control Procedures', courseName: 'Term 2: Assembly & Quality Control', leaderName: 'Priya K.', leaderInitials: 'PK', currentMembers: 3, maxMembers: 5, note: 'Working on SPC charts and control limits', minutesAgo: 12, members: ['Priya K.', 'Chen W.', 'Aaliyah M.'] },
  { id: 'grp-4', lessonId: 'lesson-1-5', lessonTitle: 'Measurements, Tolerances, and Conversions', courseName: 'Term 1: Manufacturing Foundations', leaderName: 'Devon T.', leaderInitials: 'DT', currentMembers: 4, maxMembers: 4, note: 'Full group — waitlist open', minutesAgo: 20, members: ['Devon T.', 'Riley S.', 'Kenji O.', 'Luna V.'] },
  { id: 'grp-5', lessonId: 'lesson-4-2', lessonTitle: 'Lean Manufacturing', courseName: 'Term 2: Advanced Manufacturing', leaderName: 'Aaliyah M.', leaderInitials: 'AM', currentMembers: 1, maxMembers: 3, note: 'Let\'s map a value stream together!', minutesAgo: 25, members: ['Aaliyah M.'] },
  { id: 'grp-6', lessonId: 'lesson-2-4', lessonTitle: 'Component Fabrication', courseName: 'Term 1: Tool Skills', leaderName: 'Sofia R.', leaderInitials: 'SR', currentMembers: 2, maxMembers: 4, note: 'CNC programming practice session', minutesAgo: 35, members: ['Sofia R.', 'Marcus C.'] },
  { id: 'grp-7', lessonId: 'lesson-3-1', lessonTitle: 'Assembly Techniques', courseName: 'Term 2: Assembly & Quality Control', leaderName: 'Chen W.', leaderInitials: 'CW', currentMembers: 2, maxMembers: 5, note: 'Fixture design and jig setup practice', minutesAgo: 42, members: ['Chen W.', 'Devon T.'] }
];

const GroupFinder: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'find' | 'my'>('find');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [groups, setGroups] = useState<GroupListing[]>(MOCK_GROUPS);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createCourse, setCreateCourse] = useState('');
  const [createLesson, setCreateLesson] = useState('');
  const [createMaxSize, setCreateMaxSize] = useState(4);
  const [createNote, setCreateNote] = useState('');

  const filteredGroups = selectedCourse === 'all' ? groups : groups.filter(g => g.courseName === selectedCourse);
  const handleJoin = (groupId: string) => { setGroups(prev => prev.map(g => g.id === groupId && g.currentMembers < g.maxMembers ? { ...g, currentMembers: g.currentMembers + 1, members: [...g.members, 'You'] } : g)); setMyGroups(prev => [...prev, groupId]); };
  const handleLeave = (groupId: string) => { setGroups(prev => prev.map(g => g.id === groupId ? { ...g, currentMembers: Math.max(0, g.currentMembers - 1), members: g.members.filter(m => m !== 'You') } : g)); setMyGroups(prev => prev.filter(id => id !== groupId)); };
  const handleCreate = () => {
    if (!createCourse || !createLesson) return;
    const course = MOCK_COURSES.find(c => c.id === createCourse); const lesson = course?.lessons.find(l => l.id === createLesson);
    if (!course || !lesson) return;
    const newGroup: GroupListing = { id: `grp-new-${Date.now()}`, lessonId: lesson.id, lessonTitle: lesson.title, courseName: course.title, leaderName: 'You', leaderInitials: 'ME', currentMembers: 1, maxMembers: createMaxSize, note: createNote || 'Looking for group members!', minutesAgo: 0, members: ['You'] };
    setGroups(prev => [newGroup, ...prev]); setMyGroups(prev => [...prev, newGroup.id]);
    setShowCreate(false); setCreateCourse(''); setCreateLesson(''); setCreateMaxSize(4); setCreateNote(''); setActiveTab('my');
  };
  const handleDisband = (groupId: string) => { setGroups(prev => prev.filter(g => g.id !== groupId)); setMyGroups(prev => prev.filter(id => id !== groupId)); };
  const selectedCourseObj = MOCK_COURSES.find(c => c.id === createCourse);

  return (
    <>
      <button className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 shadow text-2xl cursor-pointer transition-colors border-2 border-black" title={t('groupFinder.title', { defaultValue: 'Group Finder' })} aria-label={t('groupFinder.title', { defaultValue: 'Group Finder' })} onClick={() => setOpen(true)}>
        <span role="img" aria-label="Group">👥</span>
        {groups.filter(g => g.currentMembers < g.maxMembers).length > 0 && (<span className="absolute -top-1 -right-1 bg-lobsterRed text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{groups.filter(g => g.currentMembers < g.maxMembers).length}</span>)}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40" onClick={() => { setOpen(false); setShowCreate(false); }}>
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-lg w-full mx-4 max-h-[80vh] flex flex-col relative z-50" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 pb-3 border-b-2 border-gray-200"><div className="flex items-center gap-2"><span className="text-2xl">📋</span><h2 className="text-xl font-retro text-maineBlue">{t('groupFinder.title', { defaultValue: 'Group Finder' })}</h2></div><button onClick={() => { setOpen(false); setShowCreate(false); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><span className="text-gray-500 font-bold text-lg">✕</span></button></div>
            <div className="flex border-b-2 border-gray-200">
              <button onClick={() => setActiveTab('find')} className={`flex-1 py-2 px-4 font-bold text-sm transition-colors ${activeTab === 'find' ? 'bg-maineBlue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>🔍 {t('groupFinder.findGroup', { defaultValue: 'Find a Group' })}</button>
              <button onClick={() => setActiveTab('my')} className={`flex-1 py-2 px-4 font-bold text-sm transition-colors ${activeTab === 'my' ? 'bg-maineBlue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>📌 {t('groupFinder.myGroups', { defaultValue: 'My Groups' })} {myGroups.length > 0 && `(${myGroups.length})`}</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'find' && !showCreate && (<>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm focus:border-maineBlue focus:outline-none"><option value="all">{t('groupFinder.allCourses', { defaultValue: 'All Courses' })}</option>{MOCK_COURSES.map(c => (<option key={c.id} value={c.title}>{c.title}</option>))}</select>
                <div className="space-y-3">{filteredGroups.length === 0 ? (<div className="text-center text-gray-400 italic py-8">{t('groupFinder.noGroups', { defaultValue: 'No groups listed for this course yet.' })}</div>) : filteredGroups.map(group => (
                  <div key={group.id} className="bg-sand border border-black rounded-lg p-3"><div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><div className="font-bold text-maineBlue text-sm truncate">{group.lessonTitle}</div><div className="text-xs text-gray-500">{group.courseName}</div><div className="flex items-center gap-2 mt-1"><div className="w-6 h-6 bg-maineBlue rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">{group.leaderInitials}</div><span className="text-xs text-gray-600">{group.leaderName}</span><span className="text-xs text-gray-400">• {group.minutesAgo === 0 ? 'just now' : `${group.minutesAgo}m ago`}</span></div>{group.note && <div className="text-xs text-gray-600 italic mt-1">"{group.note}"</div>}</div><div className="flex flex-col items-end gap-1 shrink-0"><span className={`text-xs font-bold px-2 py-1 rounded-full ${group.currentMembers >= group.maxMembers ? 'bg-gray-300 text-gray-600' : 'bg-seafoam text-maineBlue'}`}>👥 {group.currentMembers}/{group.maxMembers}</span>{myGroups.includes(group.id) ? (<span className="text-xs text-seafoam font-bold bg-maineBlue px-2 py-1 rounded">✓ Joined</span>) : group.currentMembers >= group.maxMembers ? (<span className="text-xs text-gray-500 font-bold px-2 py-1">Full</span>) : (<button onClick={() => handleJoin(group.id)} className="text-xs font-bold bg-seafoam text-maineBlue px-3 py-1 rounded hover:bg-maineBlue hover:text-seafoam transition-colors border border-black">Join</button>)}</div></div></div>
                ))}</div>
                <button onClick={() => setShowCreate(true)} className="w-full mt-4 bg-maineBlue text-seafoam font-bold py-2 rounded-lg hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-black">➕ {t('groupFinder.createGroup', { defaultValue: 'Create Group' })}</button>
              </>)}
              {activeTab === 'find' && showCreate && (
                <div className="space-y-3">
                  <h3 className="font-bold text-maineBlue text-lg">➕ {t('groupFinder.createNewGroup', { defaultValue: 'Create New Group' })}</h3>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">{t('groupFinder.selectCourse', { defaultValue: 'Course' })}</label><select value={createCourse} onChange={e => { setCreateCourse(e.target.value); setCreateLesson(''); }} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-maineBlue focus:outline-none"><option value="">-- Select a course --</option>{MOCK_COURSES.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}</select></div>
                  {createCourse && (<div><label className="block text-sm font-semibold text-gray-700 mb-1">{t('groupFinder.selectLesson', { defaultValue: 'Lesson' })}</label><select value={createLesson} onChange={e => setCreateLesson(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-maineBlue focus:outline-none"><option value="">-- Select a lesson --</option>{selectedCourseObj?.lessons.map(l => (<option key={l.id} value={l.id}>{l.title}</option>))}</select></div>)}
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">{t('groupFinder.maxSize', { defaultValue: 'Max Group Size' })}: {createMaxSize}</label><input type="range" min={2} max={5} value={createMaxSize} onChange={e => setCreateMaxSize(Number(e.target.value))} className="w-full" /><div className="flex justify-between text-xs text-gray-500"><span>2</span><span>3</span><span>4</span><span>5</span></div></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">{t('groupFinder.note', { defaultValue: 'Note (optional)' })}</label><input type="text" value={createNote} onChange={e => setCreateNote(e.target.value)} placeholder="e.g. Studying for the exam..." className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-maineBlue focus:outline-none" maxLength={100} /></div>
                  <div className="flex gap-2 mt-2"><button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors">{t('groupFinder.cancel', { defaultValue: 'Cancel' })}</button><button onClick={handleCreate} disabled={!createCourse || !createLesson} className="flex-1 py-2 rounded-lg bg-maineBlue text-seafoam font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed">📋 {t('groupFinder.listGroup', { defaultValue: 'List Group' })}</button></div>
                </div>
              )}
              {activeTab === 'my' && (<>{myGroups.length === 0 ? (<div className="text-center text-gray-400 italic py-8">{t('groupFinder.noMyGroups', { defaultValue: "You haven't joined or created any groups yet." })}</div>) : (<div className="space-y-3">{groups.filter(g => myGroups.includes(g.id)).map(group => (
                <div key={group.id} className="bg-sand border border-black rounded-lg p-3"><div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><div className="font-bold text-maineBlue text-sm truncate">{group.lessonTitle}</div><div className="text-xs text-gray-500">{group.courseName}</div><div className="text-xs text-gray-600 mt-1">👥 {group.members.join(', ')}</div>{group.note && <div className="text-xs text-gray-600 italic mt-1">"{group.note}"</div>}</div><div className="flex flex-col items-end gap-1 shrink-0"><span className="text-xs font-bold px-2 py-1 rounded-full bg-seafoam text-maineBlue">👥 {group.currentMembers}/{group.maxMembers}</span>{group.leaderName === 'You' ? (<button onClick={() => handleDisband(group.id)} className="text-xs font-bold bg-lobsterRed text-white px-3 py-1 rounded hover:bg-red-700 transition-colors">Disband</button>) : (<button onClick={() => handleLeave(group.id)} className="text-xs font-bold bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition-colors">Leave</button>)}</div></div></div>
              ))}</div>)}</>)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupFinder;
