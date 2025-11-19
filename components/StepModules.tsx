
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Button, Input, Card, Spinner, Badge } from './ui/Elements';
import { suggestModuleCourses } from '../services/geminiService';

const StepModules = () => {
  const { state, addModule, updateModule, loadState } = useCurriculum();
  const [newModule, setNewModule] = useState({ name: '', description: '' });
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'TABLE' | 'LIST'>('TABLE');

  const handleAddModule = () => {
    if (!newModule.name) return;
    addModule({
        id: `MOD-${Date.now()}`,
        name: newModule.name,
        description: newModule.description,
        courseIds: [],
        prerequisites: {}
    });
    setNewModule({ name: '', description: '' });
  };

  const removeModule = (id: string) => {
      if(confirm("Delete this module?")) {
        const updated = state.modules.filter(m => m.id !== id);
        loadState({ ...state, modules: updated });
      }
  }

  const handleSuggestCourses = async (moduleId: string, moduleName: string, moduleDesc: string) => {
    setIsSuggesting(moduleId);
    try {
        const suggestedIds = await suggestModuleCourses(moduleName, moduleDesc, state.courses);
        const currentModule = state.modules.find(m => m.id === moduleId);
        if (currentModule) {
            const uniqueIds = Array.from(new Set([...currentModule.courseIds, ...suggestedIds]));
            updateModule(moduleId, { courseIds: uniqueIds });
        }
    } catch (error) {
        alert("Failed to suggest courses.");
    } finally {
        setIsSuggesting(null);
    }
  };

  const removeCourseFromModule = (moduleId: string, courseId: string) => {
    const mod = state.modules.find(m => m.id === moduleId);
    if (mod) {
        updateModule(moduleId, {
            courseIds: mod.courseIds.filter(id => id !== courseId)
        });
    }
  };

  // Sorting Logic: Basic -> Advanced based on Year in Plan
  const getCourseYear = (courseId: string) => {
      const plan = state.studyPlan.find(s => s.courseIds.includes(courseId));
      return plan ? (plan.year * 10 + plan.semester) : 99; // Unassigned = 99
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold text-slate-800">7. จัดชุดวิชา (Modules)</h2>
        <div className="flex bg-slate-200 rounded p-1">
             <button onClick={() => setViewMode('TABLE')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode==='TABLE' ? 'bg-white shadow' : ''}`}>Table</button>
             <button onClick={() => setViewMode('LIST')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode==='LIST' ? 'bg-white shadow' : ''}`}>List</button>
        </div>
      </div>

      <Card title="Create New Module">
        <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
                <Input 
                    label="Module Name" 
                    value={newModule.name} 
                    onChange={(e:any) => setNewModule({...newModule, name: e.target.value})}
                    placeholder="e.g., Data Science Essentials" 
                />
            </div>
            <div className="w-full md:w-1/2">
                <Input 
                    label="Description" 
                    value={newModule.description} 
                    onChange={(e:any) => setNewModule({...newModule, description: e.target.value})} 
                />
            </div>
            <Button onClick={handleAddModule}>Add</Button>
        </div>
      </Card>

      <div className="space-y-6">
        {state.modules.map(module => {
            const moduleCourses = module.courseIds
                .map(id => state.courses.find(c => c.id === id))
                .filter((c): c is any => !!c)
                .sort((a, b) => getCourseYear(a.id) - getCourseYear(b.id));

            return (
            <div key={module.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-slate-100 px-6 py-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{module.name}</h3>
                        <p className="text-sm text-slate-500">{module.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="secondary" 
                            onClick={() => handleSuggestCourses(module.id, module.name, module.description)}
                            disabled={isSuggesting === module.id}
                            className="text-xs"
                        >
                            {isSuggesting === module.id ? <><Spinner/> Thinking...</> : '🤖 AI Suggest'}
                        </Button>
                        <Button variant="danger" className="text-xs" onClick={() => removeModule(module.id)}>Delete</Button>
                    </div>
                </div>
                <div className="p-6">
                    {moduleCourses.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center">No courses selected yet.</p>
                    ) : viewMode === 'TABLE' ? (
                         <table className="w-full text-sm text-left">
                             <thead className="bg-slate-50 border-b">
                                 <tr>
                                     <th className="p-2">Year</th>
                                     <th className="p-2">Code</th>
                                     <th className="p-2">Name</th>
                                     <th className="p-2 text-right">Action</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {moduleCourses.map(c => {
                                     const yearVal = getCourseYear(c.id);
                                     const yearStr = yearVal === 99 ? '-' : `Y${Math.floor(yearVal/10)}/S${yearVal%10}`;
                                     return (
                                         <tr key={c.id} className="border-b last:border-0">
                                             <td className="p-2 text-slate-500">{yearStr}</td>
                                             <td className="p-2 font-bold text-slate-800">{c.code}</td>
                                             <td className="p-2">{c.nameTH}</td>
                                             <td className="p-2 text-right"><button onClick={() => removeCourseFromModule(module.id, c.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button></td>
                                         </tr>
                                     )
                                 })}
                             </tbody>
                         </table>
                    ) : (
                        <ul className="list-disc pl-5 space-y-1">
                            {moduleCourses.map(c => (
                                <li key={c.id} className="text-sm text-slate-700">
                                    <span className="font-bold">{c.code}</span> {c.nameTH} 
                                    <button onClick={() => removeCourseFromModule(module.id, c.id)} className="ml-2 text-red-400 text-xs">(Remove)</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        )})}
      </div>
    </div>
  );
};

export default StepModules;
