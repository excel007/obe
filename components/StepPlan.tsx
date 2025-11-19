
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Button, Card, Badge, Textarea } from './ui/Elements';
import { generateCourseContent } from '../services/geminiService';
import { CourseCategory } from '../types';

const StepPlan = () => {
  const { state, assignCourseToPlan, updateCourse, toggleMapping } = useCurriculum();
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, courseId: string) => {
    setDraggedCourseId(courseId);
    e.dataTransfer.setData('courseId', courseId);
  };

  const handleDrop = (e: React.DragEvent, year: number, semester: number) => {
    e.preventDefault();
    const courseId = e.dataTransfer.getData('courseId');
    if (courseId) {
        assignCourseToPlan(courseId, year, semester);
    }
    setDraggedCourseId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAIGenerate = async (courseId: string) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    setGeneratingId(courseId);
    try {
        const result = await generateCourseContent(course.nameTH, course.category, state.info.degreeLevel, state.plos);
        
        // Update Course Content
        updateCourse(courseId, {
            descriptionTH: result.descriptionTH,
            descriptionEN: result.descriptionEN,
            clos: result.clos.map((c: any, idx: number) => ({
                id: `CLO-${courseId}-${idx}`,
                code: `CLO${idx+1}`,
                actionVerb: c.actionVerb,
                description: c.description,
                bloomLevel: c.bloomLevel,
                related_plo_code: c.related_plo_code
            }))
        });

        // Apply suggested mapping to Context
        if (result.suggestedMappings) {
            result.suggestedMappings.forEach((ploCode: string) => {
                const plo = state.plos.find(p => p.code === ploCode);
                if (plo) {
                    // Update direct mapping too
                    const currentMaps = course.mappedPLOs || [];
                    if(!currentMaps.includes(plo.id)) {
                         updateCourse(courseId, { mappedPLOs: [...currentMaps, plo.id] });
                    }
                }
            });
        }

    } catch (err) {
        alert("AI Generation Failed. Please check API Key.");
    } finally {
        setGeneratingId(null);
    }
  };

  // Get unassigned courses
  const assignedIds = new Set(state.studyPlan.flatMap(p => p.courseIds));
  let unassignedCourses = state.courses.filter(c => !assignedIds.has(c.id));
  if (filterCategory !== 'ALL') {
      unassignedCourses = unassignedCourses.filter(c => c.category === filterCategory);
  }

  const getCategoryColor = (cat: CourseCategory) => {
      switch(cat) {
          case CourseCategory.GEN_ED: return 'border-l-4 border-green-500';
          case CourseCategory.CORE: return 'border-l-4 border-blue-500';
          case CourseCategory.MAJOR_REQ: return 'border-l-4 border-purple-500';
          case CourseCategory.MAJOR_ELEC: return 'border-l-4 border-purple-300';
          case CourseCategory.FREE_ELEC: return 'border-l-4 border-gray-400';
          default: return 'border-l-4 border-slate-200';
      }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Left: Unassigned Courses */}
      <div className="lg:w-1/4 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden shrink-0">
        <div className="p-3 bg-slate-100 font-bold text-slate-700 border-b flex flex-col gap-2">
            <span>รายวิชาที่ยังไม่จัดสรร</span>
            <select 
                className="text-xs font-normal p-1 border rounded"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
            >
                <option value="ALL">All Categories</option>
                {Object.values(CourseCategory).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {unassignedCourses.map(c => (
                <div 
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    className={`p-3 border border-slate-200 rounded bg-white hover:shadow-md cursor-grab active:cursor-grabbing ${getCategoryColor(c.category)}`}
                >
                    <div className="flex justify-between">
                        <span className="font-bold text-xs text-slate-800">{c.code}</span>
                        <Badge color="gray">{c.credits}</Badge>
                    </div>
                    <p className="text-sm mt-1 truncate">{c.nameTH}</p>
                    <p className="text-[10px] text-slate-500 truncate">{c.nameEN}</p>
                </div>
            ))}
        </div>
      </div>

      {/* Right: Semester Slots */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.studyPlan.map((slot) => (
                <div 
                    key={`${slot.year}-${slot.semester}`}
                    onDrop={(e) => handleDrop(e, slot.year, slot.semester)}
                    onDragOver={handleDragOver}
                    className="bg-slate-50 border border-slate-200 rounded-lg min-h-[200px] flex flex-col"
                >
                    <div className="p-2 bg-slate-200 font-bold text-center text-slate-700 rounded-t-lg">
                        ชั้นปีที่ {slot.year} ภาคการศึกษาที่ {slot.semester}
                    </div>
                    <div className="p-2 flex-1 space-y-2">
                        {slot.courseIds.map(cid => {
                            const c = state.courses.find(x => x.id === cid);
                            if (!c) return null;
                            const hasContent = c.clos && c.clos.length > 0;
                            const isExpanded = expandedCourseId === c.id;

                            return (
                                <div key={c.id} draggable onDragStart={(e) => handleDragStart(e, c.id)} className={`relative bg-white p-3 rounded border border-slate-200 shadow-sm group ${getCategoryColor(c.category)}`}>
                                    <div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}>
                                        <div>
                                            <div className="font-bold text-sm text-slate-800">{c.code} {c.nameTH}</div>
                                            <div className="text-xs text-slate-500">{c.nameEN}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge color={hasContent ? "green" : "purple"}>{hasContent ? "Content Ready" : "Draft"}</Badge>
                                            <span className="text-xs text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Accordion Content */}
                                    {isExpanded && (
                                        <div className="mt-2 pt-2 border-t border-slate-100 animate-fade-in">
                                            {/* Edit Description */}
                                            <div className="mb-2">
                                                <label className="text-[10px] font-bold text-slate-500">Description (TH)</label>
                                                <textarea 
                                                    className="w-full text-xs border rounded p-1"
                                                    value={c.descriptionTH}
                                                    onChange={(e) => updateCourse(c.id, { descriptionTH: e.target.value })}
                                                />
                                            </div>
                                            
                                            {/* CLOs */}
                                            <div className="mb-2">
                                                <label className="text-[10px] font-bold text-slate-500">CLOs (Auto-generated)</label>
                                                {c.clos.length > 0 ? (
                                                    <ul className="list-none space-y-1">
                                                        {c.clos.map((clo, idx) => (
                                                            <li key={clo.id} className="text-xs text-slate-700 bg-slate-50 p-1 rounded border border-slate-100">
                                                                <span className="font-bold text-blue-600">{clo.code}: </span>
                                                                {clo.description} 
                                                                <span className="text-[9px] text-slate-400 ml-1">[{clo.bloomLevel}]</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : <p className="text-xs text-slate-400 italic">No CLOs yet.</p>}
                                            </div>

                                            {!hasContent && (
                                                <Button 
                                                    variant="secondary" 
                                                    className="w-full text-xs py-1 h-8"
                                                    onClick={(e: any) => { e.stopPropagation(); handleAIGenerate(c.id); }}
                                                    disabled={generatingId === c.id}
                                                >
                                                    {generatingId === c.id ? '✨ Generating...' : '✨ Generate Content'}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StepPlan;
