
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Button, Input, Card, Spinner, Badge, Modal, Textarea } from './ui/Elements';
import { CourseCategory, Course } from '../types';
import { suggestGapFillingCourses } from '../services/geminiService';

const StepStructure = () => {
  const { state, addCourse, loadState, updateCourse } = useCurriculum();
  
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    code: '',
    nameTH: '',
    nameEN: '',
    credits: 3,
    category: CourseCategory.GEN_ED,
    descriptionTH: '',
    descriptionEN: '',
    mappedPLOs: []
  });

  const [isFillingGaps, setIsFillingGaps] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null); // For PLO mapping modal
  const [targetImportCategory, setTargetImportCategory] = useState<CourseCategory>(CourseCategory.GEN_ED);

  const categoriesList = Object.values(CourseCategory);

  const handleAddCourse = () => {
    if (!newCourse.code || !newCourse.nameTH) return;
    
    addCourse({
        id: `C-${Date.now()}`,
        code: newCourse.code!,
        nameTH: newCourse.nameTH!,
        nameEN: newCourse.nameEN || '',
        credits: newCourse.credits || 3,
        category: newCourse.category as CourseCategory,
        clos: [],
        descriptionTH: newCourse.descriptionTH || '',
        descriptionEN: newCourse.descriptionEN || '',
        mappedPLOs: newCourse.mappedPLOs || []
    });

    setNewCourse({
        ...newCourse,
        code: '',
        nameTH: '',
        nameEN: '',
        descriptionTH: '',
        descriptionEN: '',
        mappedPLOs: []
    });
  };

  const removeCourse = (id: string) => {
    if(confirm('Are you sure you want to delete this course?')) {
        const updated = state.courses.filter(c => c.id !== id);
        loadState({ ...state, courses: updated });
    }
  }

  const moveCourse = (id: string, targetCat: CourseCategory) => {
    const course = state.courses.find(c => c.id === id);
    if(course) {
        updateCourse(id, { category: targetCat });
    }
  }

  const handleFillGaps = async () => {
    setIsFillingGaps(true);
    try {
        const suggestions = await suggestGapFillingCourses(state.plos, state.courses);
        suggestions.forEach((s: any, idx) => {
            const mappedPloIds = s.target_plos?.map((code: string) => state.plos.find(p => p.code === code)?.id).filter((x:any)=>x) || [];
            addCourse({
                id: `AI-C-${Date.now()}-${idx}`,
                code: s.code || `NEW-${idx+1}`,
                nameTH: s.nameTH,
                nameEN: s.nameEN,
                credits: s.credits,
                category: CourseCategory.MAJOR_ELEC, // Target 2.2.2
                clos: [],
                descriptionTH: s.justification, 
                descriptionEN: s.justification,
                mappedPLOs: mappedPloIds
            })
        });
    } catch (e) {
        alert("AI Gap Analysis failed.");
    } finally {
        setIsFillingGaps(false);
    }
  };

  const handleDownloadTemplate = () => {
    const header = "Code,NameTH,NameEN,Credits,DescriptionTH,DescriptionEN\n";
    const example = "CS101,การเขียนโปรแกรม,Programming,3,คำอธิบายไทย...,Eng Description...\n";
    const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'course_template.csv';
    link.click();
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          const lines = text.split('\n').slice(1); // skip header
          lines.forEach(line => {
              const [code, nameTH, nameEN, credits, descTH, descEN] = line.split(',');
              if(code && nameTH) {
                  addCourse({
                      id: `IMP-${Date.now()}-${Math.random()}`,
                      code: code.trim(),
                      nameTH: nameTH.trim(),
                      nameEN: nameEN?.trim() || '',
                      credits: parseInt(credits?.trim() || '3'),
                      category: targetImportCategory,
                      clos: [],
                      descriptionTH: descTH?.trim(),
                      descriptionEN: descEN?.trim()
                  });
              }
          });
          alert("Imported successfully into " + targetImportCategory);
      };
      reader.readAsText(file);
      e.target.value = ''; // reset
  };

  // Mapping Modal Logic
  const togglePloMapping = (courseId: string, ploId: string) => {
      const course = state.courses.find(c => c.id === courseId);
      if(!course) return;
      const currentMaps = course.mappedPLOs || [];
      const newMaps = currentMaps.includes(ploId) 
        ? currentMaps.filter(id => id !== ploId)
        : [...currentMaps, ploId];
      updateCourse(courseId, { mappedPLOs: newMaps });
  };

  // Calculate Credits helper
  const getCredits = (category: CourseCategory) => {
      return state.courses
          .filter(c => c.category === category)
          .reduce((sum, c) => sum + c.credits, 0);
  };

  const renderCourseList = (category: CourseCategory) => {
      const courses = state.courses.filter(c => c.category === category);
      const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

      return (
          <div className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg mb-4">
              {courses.length === 0 ? <p className="text-slate-400 text-sm text-center py-2">ไม่มีรายวิชา</p> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {courses.map(c => (
                          <div key={c.id} className="border border-slate-200 p-3 rounded hover:shadow-md transition-shadow flex flex-col gap-1 relative group bg-white">
                              <div className="flex justify-between items-start">
                                  <span className="font-bold text-blue-600">{c.code}</span>
                                  <div className="flex items-center gap-1">
                                      <span className="text-xs bg-slate-100 px-1 rounded text-slate-600">{c.credits} CR</span>
                                      <button onClick={() => removeCourse(c.id)} className="text-slate-300 hover:text-red-500 font-bold px-1">&times;</button>
                                  </div>
                              </div>
                              <p className="text-sm font-medium text-slate-800 truncate" title={c.nameTH}>{c.nameTH}</p>
                              <p className="text-xs text-slate-500 truncate mb-2">{c.nameEN}</p>
                              
                              {/* Footer: Badges (Left) & Actions (Right) */}
                              <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between items-end gap-2">
                                  
                                  {/* PLO Badges */}
                                  <div className="flex flex-wrap gap-1 cursor-pointer flex-1" onClick={() => setEditingCourseId(c.id)} title="Click to map PLOs">
                                      {c.mappedPLOs && c.mappedPLOs.length > 0 ? c.mappedPLOs.map(pid => {
                                          const plo = state.plos.find(p => p.id === pid);
                                          if (!plo) return null;
                                          const num = plo.code.replace(/\D/g, '');
                                          return (
                                              <Badge key={pid} color="blue" title={plo.description}>PLO{num}</Badge>
                                          )
                                      }) : <span className="text-[10px] text-slate-300 border border-dashed px-1 rounded hover:bg-slate-50">+ Map</span>}
                                  </div>

                                  {/* Move Actions */}
                                  <div className="flex flex-col gap-1 items-end shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      {category === CourseCategory.MAJOR_REQ && (
                                          <button onClick={() => moveCourse(c.id, CourseCategory.MAJOR_ELEC)} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 font-bold">
                                              Move to 2.2.2 &darr;
                                          </button>
                                      )}
                                      {category === CourseCategory.MAJOR_ELEC && (
                                          <>
                                            <button onClick={() => moveCourse(c.id, CourseCategory.MAJOR_REQ)} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 font-bold">
                                                Move to 2.2.1 &uarr;
                                            </button>
                                            <button onClick={() => moveCourse(c.id, CourseCategory.FIELD_EXP)} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 font-bold">
                                                Move to 2.2.3 &darr;
                                            </button>
                                          </>
                                      )}
                                      {category === CourseCategory.FIELD_EXP && (
                                          <button onClick={() => moveCourse(c.id, CourseCategory.MAJOR_ELEC)} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 font-bold">
                                              Move to 2.2.2 &uarr;
                                          </button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )
  };

  const renderHeader = (title: string, category?: CourseCategory, customTotal?: number) => {
      let total = customTotal;
      if (category && customTotal === undefined) {
          total = getCredits(category);
      }
      return (
        <div className="bg-slate-800 text-white px-4 py-2 rounded-t-lg font-bold mt-4 flex justify-between items-center">
            <span>{title}</span>
            {total !== undefined && <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-yellow-300 font-mono">รวม {total} หน่วยกิต</span>}
        </div>
      );
  };

  const renderSubHeader = (title: string, category: CourseCategory) => {
      const total = getCredits(category);
      return (
        <div className="bg-slate-100 px-4 py-2 font-bold text-sm text-slate-600 flex justify-between items-center border-l-4 border-slate-300">
            <span>{title}</span>
            <span className="text-slate-500 text-xs">[{total} หน่วยกิต]</span>
        </div>
      );
  };

  // Calculate Totals for Summary
  const crGenEd = getCredits(CourseCategory.GEN_ED);
  const crCore = getCredits(CourseCategory.CORE);
  const crMajorReq = getCredits(CourseCategory.MAJOR_REQ);
  const crMajorElec = getCredits(CourseCategory.MAJOR_ELEC);
  const crField = getCredits(CourseCategory.FIELD_EXP);
  const crFree = getCredits(CourseCategory.FREE_ELEC);
  
  const crSpecific = crCore + crMajorReq + crMajorElec + crField;
  const crSpecificMajor = crMajorReq + crMajorElec + crField;
  
  const crTotalCalculated = crGenEd + crSpecific + crFree;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">4. โครงสร้างหลักสูตร (Curriculum Structure)</h2>
        <div className="flex flex-wrap gap-2 items-center bg-slate-100 p-2 rounded-lg">
            <select 
                className="text-xs p-1 rounded border-slate-300" 
                value={targetImportCategory}
                onChange={(e) => setTargetImportCategory(e.target.value as CourseCategory)}
            >
                {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs px-3 py-1 rounded flex items-center gap-1">
                <span>📂 Import CSV</span>
                <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
            </label>
            <Button variant="ghost" onClick={handleDownloadTemplate} className="text-xs">⬇ Template</Button>
        </div>
      </div>

      {/* Add Course Form */}
      <Card className="bg-slate-50 border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-3">Add New Course</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <Input label="รหัสวิชา" value={newCourse.code} onChange={(e:any)=>setNewCourse({...newCourse, code: e.target.value})} placeholder="CS101" />
            <div className="lg:col-span-2"><Input label="ชื่อวิชา (TH)" value={newCourse.nameTH} onChange={(e:any)=>setNewCourse({...newCourse, nameTH: e.target.value})} /></div>
            <Input label="หน่วยกิต" type="number" value={newCourse.credits} onChange={(e:any)=>setNewCourse({...newCourse, credits: parseInt(e.target.value)})} />
            <div className="lg:col-span-2"><Input label="Course Name (EN)" value={newCourse.nameEN} onChange={(e:any)=>setNewCourse({...newCourse, nameEN: e.target.value})} /></div>
            <div className="lg:col-span-2">
                <label className="text-sm font-medium text-slate-700">หมวดวิชา</label>
                <select 
                    className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
                    value={newCourse.category}
                    onChange={(e)=>setNewCourse({...newCourse, category: e.target.value as CourseCategory})}
                >
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="lg:col-span-4">
                <Textarea placeholder="คำอธิบายรายวิชา (TH) - Optional" value={newCourse.descriptionTH} onChange={(e:any)=>setNewCourse({...newCourse, descriptionTH: e.target.value})} rows={2} />
            </div>
            <div className="lg:col-span-4 flex justify-end">
                <Button onClick={handleAddCourse}>เพิ่มวิชา</Button>
            </div>
        </div>
      </Card>

      {/* AI Gap Analysis */}
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg flex justify-between items-center">
        <div>
            <h4 className="text-purple-800 font-bold text-sm">✨ AI Gap Analysis</h4>
            <p className="text-purple-600 text-xs">Analyses mapped PLOs and suggests courses for "2.2.2 วิชาเฉพาะเลือก"</p>
        </div>
        <Button variant="secondary" onClick={handleFillGaps} disabled={isFillingGaps} className="text-xs">
            {isFillingGaps ? <><Spinner/> Thinking...</> : '🔍 Analyze Gaps & Suggest Courses'}
        </Button>
      </div>

      {/* Course Structure Visualization */}
      <div className="space-y-1">
        {/* 1. GEN ED */}
        {renderHeader(CourseCategory.GEN_ED, CourseCategory.GEN_ED)}
        {renderCourseList(CourseCategory.GEN_ED)}

        {/* 2. Specific */}
        {renderHeader("2. หมวดวิชาเฉพาะ", undefined, crSpecific)}
        <div className="border-l-4 border-slate-800 ml-2 pl-2">
            {/* 2.1 Core */}
            <div className="bg-slate-200 text-slate-800 px-4 py-2 font-bold flex justify-between">
                <span>{CourseCategory.CORE}</span>
                <span className="text-sm text-slate-600">[{crCore} หน่วยกิต]</span>
            </div>
            {renderCourseList(CourseCategory.CORE)}

            {/* 2.2 Specific Major */}
            <div className="bg-slate-200 text-slate-800 px-4 py-2 font-bold flex justify-between">
                <span>2.2 วิชาเฉพาะด้าน</span>
                <span className="text-sm text-slate-600">[{crSpecificMajor} หน่วยกิต]</span>
            </div>
            <div className="border-l-4 border-slate-300 ml-2 pl-2">
                 {renderSubHeader(CourseCategory.MAJOR_REQ, CourseCategory.MAJOR_REQ)}
                 {renderCourseList(CourseCategory.MAJOR_REQ)}

                 {renderSubHeader(CourseCategory.MAJOR_ELEC, CourseCategory.MAJOR_ELEC)}
                 {renderCourseList(CourseCategory.MAJOR_ELEC)}

                 {renderSubHeader(CourseCategory.FIELD_EXP, CourseCategory.FIELD_EXP)}
                 {renderCourseList(CourseCategory.FIELD_EXP)}
            </div>
        </div>

        {/* 2.3 Free Elec */}
        {renderHeader(CourseCategory.FREE_ELEC, CourseCategory.FREE_ELEC)}
        {renderCourseList(CourseCategory.FREE_ELEC)}
      </div>

      {/* Credit Summary Table */}
      <div className="mt-10 pt-6 border-t-2 border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">สรุปจำนวนหน่วยกิตตามโครงสร้าง (Credit Summary)</h3>
          <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                          <th className="px-4 py-3 border-b">หมวดวิชา</th>
                          <th className="px-4 py-3 border-b text-center w-40">เกณฑ์ (Standard)</th>
                          <th className="px-4 py-3 border-b text-center w-40 text-blue-700">ที่จัดได้ (Actual)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                      <tr>
                          <td className="px-4 py-2 font-bold">1. หมวดวิชาศึกษาทั่วไป</td>
                          <td className="px-4 py-2 text-center text-slate-500">24</td>
                          <td className="px-4 py-2 text-center font-bold text-blue-700">{crGenEd}</td>
                      </tr>
                      <tr className="bg-slate-50">
                          <td className="px-4 py-2 font-bold">2. หมวดวิชาเฉพาะ</td>
                          <td className="px-4 py-2 text-center text-slate-500">-</td>
                          <td className="px-4 py-2 text-center font-bold text-blue-700">{crSpecific}</td>
                      </tr>
                      <tr>
                          <td className="px-4 py-2 pl-8">2.1 กลุ่มวิชาพื้นฐานวิชาชีพ</td>
                          <td className="px-4 py-2 text-center text-slate-500">-</td>
                          <td className="px-4 py-2 text-center">{crCore}</td>
                      </tr>
                      <tr>
                          <td className="px-4 py-2 pl-8">2.2 วิชาเฉพาะด้าน</td>
                          <td className="px-4 py-2 text-center text-slate-500">-</td>
                          <td className="px-4 py-2 text-center">{crSpecificMajor}</td>
                      </tr>
                      <tr>
                          <td className="px-4 py-2 pl-12 text-slate-600">2.2.1 กลุ่มวิชาบังคับ</td>
                          <td className="px-4 py-2 text-center text-slate-500">-</td>
                          <td className="px-4 py-2 text-center">{crMajorReq}</td>
                      </tr>
                      <tr>
                          <td className="px-4 py-2 pl-12 text-slate-600">2.2.2 กลุ่มวิชาเลือก</td>
                          <td className="px-4 py-2 text-center text-slate-500">-</td>
                          <td className="px-4 py-2 text-center">{crMajorElec}</td>
                      </tr>
                      <tr>
                          <td className="px-4 py-2 pl-12 text-slate-600">2.2.3 กลุ่มวิชาฝึกประสบการณ์วิชาชีพ</td>
                          <td className="px-4 py-2 text-center text-slate-500">-</td>
                          <td className="px-4 py-2 text-center">{crField}</td>
                      </tr>
                      <tr className="bg-slate-50">
                          <td className="px-4 py-2 font-bold">3. หมวดวิชาเลือกเสรี</td>
                          <td className="px-4 py-2 text-center text-slate-500">6</td>
                          <td className="px-4 py-2 text-center font-bold text-blue-700">{crFree}</td>
                      </tr>
                      <tr className="bg-slate-800 text-white">
                          <td className="px-4 py-3 font-bold text-right">รวมหน่วยกิตตลอดหลักสูตร</td>
                          <td className="px-4 py-3 text-center font-bold">{state.info.totalCredits}</td>
                          <td className={`px-4 py-3 text-center font-bold ${crTotalCalculated >= state.info.totalCredits ? 'text-green-400' : 'text-yellow-400'}`}>
                              {crTotalCalculated}
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>

      {/* PLO Mapping Modal */}
      <Modal 
        isOpen={!!editingCourseId} 
        onClose={() => setEditingCourseId(null)} 
        title={`Map PLOs for ${state.courses.find(c => c.id === editingCourseId)?.code}`}
      >
         <div className="space-y-2">
            <p className="text-sm text-slate-500 mb-4">Select the PLOs that this course contributes to:</p>
            {state.plos.map(plo => {
                const isChecked = state.courses.find(c => c.id === editingCourseId)?.mappedPLOs?.includes(plo.id);
                return (
                    <label key={plo.id} className="flex items-start gap-3 p-3 border rounded hover:bg-slate-50 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => editingCourseId && togglePloMapping(editingCourseId, plo.id)}
                            className="mt-1" 
                        />
                        <div>
                            <span className="font-bold text-blue-600 block text-sm">{plo.code}</span>
                            <span className="text-xs text-slate-600">{plo.description}</span>
                        </div>
                    </label>
                )
            })}
         </div>
      </Modal>
    </div>
  );
};

export default StepStructure;
