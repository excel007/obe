
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Card } from './ui/Elements';

const StepRelations = () => {
  const { state } = useCurriculum();
  const [rootType, setRootType] = useState<'PLO' | 'YLO'>('PLO');
  const [viewMode, setViewMode] = useState<'TABLE' | 'NODE'>('TABLE');

  // Helper: Get Year for a Course
  const getCourseYear = (courseId: string) => {
      const plan = state.studyPlan.find(s => s.courseIds.includes(courseId));
      return plan ? plan.year : null;
  };

  // Helper: Get derived YLOs for a PLO
  // Logic: PLO -> Mapped Courses -> Course Year -> YLO for that Year
  const getDerivedYLOsForPLO = (ploId: string) => {
      const mappedCourses = state.courses.filter(c => c.mappedPLOs?.includes(ploId));
      const years = new Set(mappedCourses.map(c => getCourseYear(c.id)).filter(y => y !== null));
      // Find YLOs corresponding to these years
      // Assuming generic YLOs for years (filtering state.ylos by year)
      // We filter YLOs that match the years derived from the courses
      return state.ylos.filter(y => years.has(y.year)).sort((a,b) => a.year - b.year);
  };

  // Helper: Get derived PLOs for a YLO
  // Logic: YLO -> Year -> Courses in Year -> Mapped PLOs
  const getDerivedPLOsForYLO = (ylo: any) => { // ylo object
      const coursesInYear = state.studyPlan
          .filter(slot => slot.year === ylo.year)
          .flatMap(slot => slot.courseIds)
          .map(cid => state.courses.find(c => c.id === cid))
          .filter(c => c);
      
      const ploIds = new Set<string>();
      coursesInYear.forEach((c: any) => {
          c.mappedPLOs?.forEach((pid: string) => ploIds.add(pid));
      });

      return state.plos.filter(p => ploIds.has(p.id));
  }

  const getCoursesForPLO = (ploId: string) => {
    return state.courses.filter(c => c.mappedPLOs?.includes(ploId));
  };

  const getCoursesForYLOYear = (year: number) => {
     const courseIds = state.studyPlan.filter(s => s.year === year).flatMap(s => s.courseIds);
     return state.courses.filter(c => courseIds.includes(c.id));
  }

  const renderTable = () => {
      if (rootType === 'PLO') {
          return (
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100 text-xs uppercase">
                    <tr>
                        <th className="px-4 py-2 border w-24 text-center">PLO</th>
                        <th className="px-4 py-2 border w-1/4 relative group cursor-help">
                            Derived YLOs
                            <span className="absolute hidden group-hover:block bg-black text-white text-[10px] p-1 rounded top-full left-0 z-10 w-48 font-normal normal-case">
                                Logic: PLO maps to Courses, Courses are assigned to Years. YLOs of those years are displayed here.
                            </span>
                        </th>
                        <th className="px-4 py-2 border">Related Courses</th>
                    </tr>
                </thead>
                <tbody>
                    {state.plos.map(plo => {
                        const ylos = getDerivedYLOsForPLO(plo.id);
                        const courses = getCoursesForPLO(plo.id);
                        return (
                            <tr key={plo.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-4 py-2 border align-top text-center bg-blue-50">
                                    <span className="font-bold text-blue-600 block">{plo.code}</span>
                                    <span className="text-[10px] text-slate-400 cursor-help" title={plo.description}>🛈</span>
                                </td>
                                <td className="px-4 py-2 border align-top">
                                    <div className="flex flex-col gap-1">
                                        {ylos.map(y => (
                                            <span key={y.id} className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded border border-green-100" title={y.description}>
                                                Year {y.year}
                                            </span>
                                        ))}
                                        {ylos.length === 0 && <span className="text-slate-300 text-xs">-</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-2 border align-top">
                                    <div className="flex flex-wrap gap-1">
                                        {courses.map(c => <span key={c.id} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded border border-slate-200">{c.code} {c.nameTH}</span>)}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
          );
      } else {
          return (
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100 text-xs uppercase">
                    <tr>
                        <th className="px-4 py-2 border">YLO (Year)</th>
                        <th className="px-4 py-2 border">Derived PLOs</th>
                        <th className="px-4 py-2 border">Courses in this Year</th>
                    </tr>
                </thead>
                <tbody>
                    {[1,2,3,4].map(year => {
                        const ylos = state.ylos.filter(y => y.year === year);
                        // Even if multiple YLOs per year, usually we group by Year logic
                        if (ylos.length === 0) return null;

                        const courses = getCoursesForYLOYear(year);
                        const derivedPLOs = getDerivedPLOsForYLO({ year });

                        return (
                            <tr key={year} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-4 py-2 border align-top w-48">
                                    <div className="font-bold text-green-600 mb-1">Year {year}</div>
                                    {ylos.map(y => (
                                        <div key={y.id} className="text-xs text-slate-500 mb-1 italic border-l-2 border-green-200 pl-2">{y.description}</div>
                                    ))}
                                </td>
                                <td className="px-4 py-2 border align-top">
                                    <div className="flex flex-wrap gap-1">
                                        {derivedPLOs.map(p => (
                                            <span key={p.id} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border border-blue-100 cursor-help" title={p.description}>{p.code}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-2 border align-top">
                                    <div className="flex flex-wrap gap-1">
                                        {courses.map(c => <span key={c.id} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{c.code}</span>)}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
          )
      }
  };

  const renderNode = () => {
      // Simple Tree Visualization using CSS grid/flex
      const items = rootType === 'PLO' ? state.plos : state.ylos.sort((a,b)=>a.year-b.year);
      
      return (
          <div className="bg-slate-50 p-6 rounded-lg space-y-8 overflow-x-auto">
              {items.map(item => {
                  const code = rootType === 'PLO' ? (item as any).code : `Year ${(item as any).year}`;
                  const subItems = rootType === 'PLO' 
                    ? getCoursesForPLO(item.id) 
                    : getCoursesForYLOYear((item as any).year);
                  
                  if (subItems.length === 0) return null;

                  return (
                      <div key={item.id} className="flex items-start gap-6">
                           <div className={`w-32 h-32 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${rootType === 'PLO' ? 'bg-blue-600' : 'bg-green-600'}`}>
                               {code}
                           </div>
                           <div className="flex flex-wrap gap-4 flex-1 items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                               {subItems.map(c => (
                                   <div key={c.id} className="border p-2 rounded min-w-[120px] text-center bg-slate-50">
                                       <div className="font-bold text-slate-800 text-sm">{c.code}</div>
                                       <div className="text-xs text-slate-500 truncate w-32 mx-auto">{c.nameTH}</div>
                                   </div>
                               ))}
                           </div>
                      </div>
                  )
              })}
          </div>
      )
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">6. ความสัมพันธ์ PLO/YLO/CLO (Derived Logic)</h2>
          <div className="flex gap-4">
             <div className="flex bg-slate-200 rounded p-1">
                <button onClick={() => setRootType('PLO')} className={`px-3 py-1 rounded text-xs font-bold ${rootType==='PLO' ? 'bg-white shadow' : ''}`}>PLO Root</button>
                <button onClick={() => setRootType('YLO')} className={`px-3 py-1 rounded text-xs font-bold ${rootType==='YLO' ? 'bg-white shadow' : ''}`}>YLO Root</button>
             </div>
             <div className="flex bg-slate-200 rounded p-1">
                <button onClick={() => setViewMode('TABLE')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode==='TABLE' ? 'bg-white shadow' : ''}`}>Table</button>
                <button onClick={() => setViewMode('NODE')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode==='NODE' ? 'bg-white shadow' : ''}`}>Diagram</button>
             </div>
          </div>
       </div>
       
       <Card>
           {viewMode === 'TABLE' ? renderTable() : renderNode()}
       </Card>

       <div className="mt-8">
          <h4 className="font-bold text-sm text-slate-500 mb-2">Reference Table</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h5 className="text-xs font-bold text-blue-600 mb-2 uppercase">PLO Reference</h5>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                      {state.plos.map(p => (
                          <div key={p.id} className="text-xs flex gap-2">
                              <span className="font-bold">{p.code}:</span> <span className="text-slate-600">{p.description}</span>
                          </div>
                      ))}
                  </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h5 className="text-xs font-bold text-green-600 mb-2 uppercase">YLO Reference</h5>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                      {state.ylos.sort((a,b)=>a.year-b.year).map(y => (
                          <div key={y.id} className="text-xs flex gap-2">
                              <span className="font-bold">Year {y.year}:</span> <span className="text-slate-600">{y.description}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
       </div>
    </div>
  );
};

export default StepRelations;
