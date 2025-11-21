
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { CourseCategory } from '../types';
import { Card, Button, Badge } from './ui/Elements';

const StepCourseReport = () => {
  const { state } = useCurriculum();
  const allCategories = Object.values(CourseCategory);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(allCategories);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleAll = () => {
    if (selectedCategories.length === allCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(allCategories);
    }
  };

  const groupedCourses = allCategories.map(cat => ({
    category: cat,
    courses: state.courses.filter(c => c.category === cat && selectedCategories.includes(cat))
  })).filter(g => g.courses.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <h2 className="text-xl font-bold text-slate-800">9. รายงานรายละเอียดรายวิชา (Course Specifications)</h2>
        <Button onClick={() => window.print()} variant="primary">🖨 Print Report (Ctrl+P)</Button>
      </div>

      {/* Filter Controls (Hidden on Print) */}
      <Card className="print:hidden">
        <div className="flex justify-between items-center mb-4">
             <h4 className="font-bold text-slate-700">Select Categories to Print</h4>
             <button onClick={toggleAll} className="text-xs text-blue-600 font-bold hover:underline">
                 {selectedCategories.length === allCategories.length ? 'Deselect All' : 'Select All'}
             </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
             {allCategories.map(cat => (
                 <label key={cat} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200">
                     <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                     />
                     <span className="text-sm text-slate-700">{cat}</span>
                 </label>
             ))}
        </div>
      </Card>

      {/* Report Content */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0">
          <div className="text-center mb-8 border-b pb-4">
              <h1 className="text-2xl font-bold text-slate-900">{state.info.nameTH}</h1>
              <h2 className="text-lg text-slate-600">{state.info.nameEN}</h2>
              <p className="text-sm text-slate-500 mt-2">Course Specification Report</p>
          </div>

          {groupedCourses.length === 0 && <p className="text-center text-slate-400 italic py-10">No courses selected for display.</p>}

          <div className="space-y-8">
              {groupedCourses.map((group, idx) => (
                  <div key={group.category} className="break-inside-avoid">
                      <h3 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 text-slate-800 print:bg-slate-100 print:text-black">
                          {group.category}
                      </h3>
                      <div className="space-y-6">
                          {group.courses.map(c => (
                              <div key={c.id} className="border border-slate-200 rounded-lg p-4 print:border-slate-300 break-inside-avoid">
                                  <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
                                      <div>
                                          <div className="flex items-baseline gap-2">
                                               <span className="text-lg font-bold text-slate-900">{c.code}</span>
                                               <span className="text-lg font-semibold text-slate-800">{c.nameTH}</span>
                                          </div>
                                          <div className="text-sm text-slate-600 italic">{c.nameEN}</div>
                                      </div>
                                      <div className="text-right">
                                          <span className="bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded text-sm border border-slate-300 block w-fit ml-auto">
                                              {c.credits} หน่วยกิต
                                          </span>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4 text-sm mb-4">
                                      <div>
                                          <strong className="block text-slate-700 font-semibold mb-1">คำอธิบายรายวิชา (TH):</strong>
                                          <p className="text-slate-600 pl-2 border-l-2 border-slate-200">{c.descriptionTH || "-"}</p>
                                      </div>
                                      <div>
                                          <strong className="block text-slate-700 font-semibold mb-1">Course Description (EN):</strong>
                                          <p className="text-slate-600 pl-2 border-l-2 border-slate-200">{c.descriptionEN || "-"}</p>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                          <strong className="block text-slate-700 font-semibold mb-2 border-b pb-1">Course Learning Outcomes (CLOs)</strong>
                                          {c.clos.length > 0 ? (
                                              <ul className="list-disc pl-4 space-y-1">
                                                  {c.clos.map(clo => (
                                                      <li key={clo.id}>
                                                          <span className="font-bold text-blue-700 mr-1">{clo.code}:</span> 
                                                          {clo.description}
                                                      </li>
                                                  ))}
                                              </ul>
                                          ) : <span className="text-slate-400 italic">- No CLOs defined -</span>}
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                          <strong className="block text-slate-700 font-semibold mb-2 border-b pb-1">Mapped PLOs</strong>
                                          {c.mappedPLOs && c.mappedPLOs.length > 0 ? (
                                              <div className="flex flex-wrap gap-2">
                                                  {c.mappedPLOs.map(pid => {
                                                      const plo = state.plos.find(p => p.id === pid);
                                                      return plo ? (
                                                          <span key={pid} className="bg-white border border-slate-300 px-2 py-1 rounded text-xs shadow-sm">
                                                              <b>{plo.code}</b>
                                                          </span>
                                                      ) : null;
                                                  })}
                                              </div>
                                          ) : <span className="text-slate-400 italic">- Unmapped -</span>}
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default StepCourseReport;