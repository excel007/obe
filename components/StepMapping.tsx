
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Card } from './ui/Elements';
import { CourseCategory } from '../types';

const StepMapping = () => {
  const { state } = useCurriculum();
  const [viewMode, setViewMode] = useState<'TABLE' | 'NODE'>('TABLE');

  // Filter relevant courses (2.1, 2.2.1, 2.2.2)
  const targetCategories = [CourseCategory.CORE, CourseCategory.MAJOR_REQ, CourseCategory.MAJOR_ELEC];
  const relevantCourses = state.courses.filter(c => targetCategories.includes(c.category));
  
  // Sort: Core -> Req -> Elec
  const sortedCourses = relevantCourses.sort((a, b) => {
      const catOrder = { [CourseCategory.CORE]: 1, [CourseCategory.MAJOR_REQ]: 2, [CourseCategory.MAJOR_ELEC]: 3 };
      return (catOrder[a.category] || 99) - (catOrder[b.category] || 99);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">6. ความสัมพันธ์ PLO/CLO (Mapping Matrix)</h2>
          <div className="flex bg-slate-200 rounded p-1">
              <button 
                className={`px-3 py-1 rounded text-xs font-medium ${viewMode === 'TABLE' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}
                onClick={() => setViewMode('TABLE')}
              >
                Table View
              </button>
              <button 
                className={`px-3 py-1 rounded text-xs font-medium ${viewMode === 'NODE' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}
                onClick={() => setViewMode('NODE')}
              >
                Node Diagram
              </button>
          </div>
      </div>

      {viewMode === 'TABLE' ? (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 border-collapse">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                        <th className="px-4 py-3 border w-16 text-center">PLO</th>
                        <th className="px-4 py-3 border">PLO Description</th>
                        <th className="px-4 py-3 border">Mapped Courses (Core & Specific)</th>
                    </tr>
                </thead>
                <tbody>
                    {state.plos.map(plo => (
                        <tr key={plo.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-center border bg-slate-50 text-blue-600">{plo.code}</td>
                            <td className="px-4 py-3 border max-w-xs">{plo.description}</td>
                            <td className="px-4 py-3 border">
                                <div className="flex flex-wrap gap-2">
                                    {sortedCourses
                                        .filter(c => c.mappedPLOs?.includes(plo.id))
                                        .map(c => (
                                            <div key={c.id} className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded text-xs flex flex-col">
                                                <span className="font-bold">{c.code}</span>
                                                <span className="text-[10px] opacity-75 truncate max-w-[100px]">{c.nameTH}</span>
                                            </div>
                                        ))
                                    }
                                    {sortedCourses.filter(c => c.mappedPLOs?.includes(plo.id)).length === 0 && (
                                        <span className="text-slate-300 text-xs italic">No courses mapped</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </Card>
      ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-8 overflow-x-auto min-h-[500px]">
              <div className="flex flex-col gap-8">
                  {state.plos.map(plo => {
                      const mapped = sortedCourses.filter(c => c.mappedPLOs?.includes(plo.id));
                      if (mapped.length === 0) return null;
                      return (
                          <div key={plo.id} className="flex items-start">
                              {/* PLO Node */}
                              <div className="w-48 shrink-0 p-4 bg-blue-600 text-white rounded-lg shadow-lg z-10 relative">
                                  <div className="font-bold text-lg">{plo.code}</div>
                                  <div className="text-xs opacity-90 mt-1">{plo.description}...</div>
                              </div>

                              {/* Course Nodes */}
                              <div className="ml-8 flex flex-wrap gap-4 items-center border-l-2 border-blue-500 pl-8 py-2">
                                  {mapped.map(c => (
                                      <div key={c.id} className="bg-slate-100 border border-slate-300 text-slate-800 p-2 rounded w-48 hover:bg-slate-200 transition-colors shadow-sm">
                                          <div className="font-mono font-bold text-blue-700 text-xs">{c.code}</div>
                                          <div className="text-xs">{c.nameTH}</div>
                                          <div className="text-[10px] text-slate-500 mt-1">{c.category}</div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )}
    </div>
  );
};

export default StepMapping;
