
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Button, Card, Badge, Textarea } from './ui/Elements';
import { generateCourseContent } from '../services/geminiService';
import { CourseCategory } from '../types';
import { openPrintWindow, getCategoryCode } from '../services/printService';

const StepPlan = () => {
  const { state, assignCourseToPlan, removeCourseFromPlan, updateCourse, toggleMapping } = useCurriculum();
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

  const handlePrintPlan = () => {
      let html = `<h1 class="text-2xl font-bold text-center mb-6">แผนการศึกษา (Study Plan)</h1>`;
      html += `<h2 class="text-lg text-center mb-8 text-slate-600">${state.info.nameTH}</h2>`;
      
      html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-8">`;
      
      state.studyPlan.forEach(slot => {
          // Only show slots with courses or if it's a standard 4-year plan (8 slots usually)
          // Let's check if it has courses to avoid clutter in print or print empty if standard.
          // Let's print all 8 slots generally.
          
          const slotCourses = slot.courseIds.map(id => state.courses.find(c => c.id === id)).filter(c=>c);
          const totalCredits = slotCourses.reduce((sum, c) => sum + (c?.credits || 0), 0);

          html += `<div class="mb-4 break-inside-avoid border border-slate-200 p-4 rounded">`;
          html += `<div class="font-bold bg-slate-100 p-2 border-b border-slate-300 mb-2">ชั้นปีที่ ${slot.year} ภาคการศึกษาที่ ${slot.semester}</div>`;
          
          if (slotCourses.length > 0) {
              html += `<ul class="list-disc pl-6 mt-2 space-y-1">`;
              slotCourses.forEach(c => {
                  if(!c) return;
                  const catCode = getCategoryCode(c.category);
                  html += `<li><b>${c.code}</b> ${c.nameEN} <span class="text-sm">(${c.credits})</span> <span class="text-xs text-slate-500">(${catCode})</span></li>`;
              });
              html += `</ul>`;
              html += `<div class="text-right font-bold text-sm mt-4 border-t pt-2">รวม ${totalCredits} หน่วยกิต</div>`;
          } else {
              html += `<p class="text-slate-400 text-sm italic text-center py-2">ยังไม่มีรายวิชา</p>`;
          }
          html += `</div>`;
      });
      
      html += `</div>`;
      
      openPrintWindow("แผนการศึกษา", html);
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

  // Credit Calculation helper (assigned only)
  const getAssignedCredits = (category: CourseCategory) => {
      const assignedCourseIds = state.studyPlan.flatMap(p => p.courseIds);
      return state.courses
          .filter(c => c.category === category && assignedCourseIds.includes(c.id))
          .reduce((sum, c) => sum + (c.credits || 0), 0);
  };

  const crGenEd = getAssignedCredits(CourseCategory.GEN_ED);
  const crCore = getAssignedCredits(CourseCategory.CORE);
  const crMajorReq = getAssignedCredits(CourseCategory.MAJOR_REQ);
  const crMajorElec = getAssignedCredits(CourseCategory.MAJOR_ELEC);
  const crField = getAssignedCredits(CourseCategory.FIELD_EXP);
  const crFree = getAssignedCredits(CourseCategory.FREE_ELEC);
  
  const crSpecific = crCore + crMajorReq + crMajorElec + crField;
  const crSpecificMajor = crMajorReq + crMajorElec + crField;
  const crTotalAssigned = crGenEd + crSpecific + crFree;
  const std = state.info.creditStructure || { total: 0, genEd: 0, core: 0, majorReq: 0, majorElec: 0, fieldExp: 0, freeElec: 0 };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex justify-between items-center mb-4 shrink-0">
         <h2 className="text-xl font-bold text-slate-800">5. แผนการเรียน (Study Plan)</h2>
         <Button onClick={handlePrintPlan} variant="primary">🖨 พิมพ์แผนการเรียน</Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        {/* Left: Unassigned Courses */}
        <div className="lg:w-1/4 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden shrink-0 h-full">
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
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); removeCourseFromPlan(c.id); }}
                                                    className="text-slate-400 hover:text-red-500 font-bold text-xs px-1 ml-1"
                                                    title="Remove from plan"
                                                >
                                                    ✕
                                                </button>
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
            
            {/* Credit Summary Footer */}
            <div className="mt-8 pb-10">
                <h3 className="text-lg font-bold text-slate-800 mb-4">สรุปจำนวนหน่วยกิตตามแผนการเรียน (Plan Credit Summary)</h3>
                <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                            <tr>
                                <th className="px-4 py-3 border-b">หมวดวิชา</th>
                                <th className="px-4 py-3 border-b text-center w-40">หน่วยกิตที่กำหนด (Standard)</th>
                                <th className="px-4 py-3 border-b text-center w-40 text-blue-700">ที่จัดลงแผน (Assigned)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            <tr>
                                <td className="px-4 py-2 font-bold">1. หมวดวิชาศึกษาทั่วไป</td>
                                <td className="px-4 py-2 text-center text-slate-500">{std.genEd}</td>
                                <td className={`px-4 py-2 text-center font-bold ${crGenEd >= std.genEd ? 'text-green-600' : 'text-red-500'}`}>{crGenEd}</td>
                            </tr>
                            <tr className="bg-slate-50">
                                <td className="px-4 py-2 font-bold">2. หมวดวิชาเฉพาะ</td>
                                <td className="px-4 py-2 text-center text-slate-500">-</td>
                                <td className="px-4 py-2 text-center font-bold text-blue-700">{crSpecific}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 pl-8">2.1 กลุ่มวิชาพื้นฐานวิชาชีพ</td>
                                <td className="px-4 py-2 text-center text-slate-500">{std.core}</td>
                                <td className={`px-4 py-2 text-center ${crCore >= std.core ? 'text-green-600' : 'text-red-500'}`}>{crCore}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 pl-8">2.2 วิชาเฉพาะด้าน</td>
                                <td className="px-4 py-2 text-center text-slate-500">-</td>
                                <td className="px-4 py-2 text-center">{crSpecificMajor}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 pl-12 text-slate-600">2.2.1 กลุ่มวิชาบังคับ</td>
                                <td className="px-4 py-2 text-center text-slate-500">{std.majorReq}</td>
                                <td className={`px-4 py-2 text-center ${crMajorReq >= std.majorReq ? 'text-green-600' : 'text-red-500'}`}>{crMajorReq}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 pl-12 text-slate-600">2.2.2 กลุ่มวิชาเลือก</td>
                                <td className="px-4 py-2 text-center text-slate-500">{std.majorElec}</td>
                                <td className={`px-4 py-2 text-center ${crMajorElec >= std.majorElec ? 'text-green-600' : 'text-red-500'}`}>{crMajorElec}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 pl-12 text-slate-600">2.2.3 กลุ่มวิชาฝึกประสบการณ์ฯ</td>
                                <td className="px-4 py-2 text-center text-slate-500">{std.fieldExp}</td>
                                <td className={`px-4 py-2 text-center ${crField >= std.fieldExp ? 'text-green-600' : 'text-red-500'}`}>{crField}</td>
                            </tr>
                            <tr className="bg-slate-50">
                                <td className="px-4 py-2 font-bold">3. หมวดวิชาเลือกเสรี</td>
                                <td className="px-4 py-2 text-center text-slate-500">{std.freeElec}</td>
                                <td className={`px-4 py-2 text-center font-bold ${crFree >= std.freeElec ? 'text-green-600' : 'text-red-500'}`}>{crFree}</td>
                            </tr>
                            <tr className="bg-slate-800 text-white">
                                <td className="px-4 py-3 font-bold text-right">รวมหน่วยกิตตลอดหลักสูตร</td>
                                <td className="px-4 py-3 text-center font-bold">{std.total}</td>
                                <td className={`px-4 py-3 text-center font-bold ${crTotalAssigned >= std.total ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {crTotalAssigned}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StepPlan;