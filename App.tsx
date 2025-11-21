
import React, { useRef, useState } from 'react';
import { useCurriculum } from './context/CurriculumContext';
import StepIdentity from './components/StepIdentity';
import StepOutcomes from './components/StepOutcomes';
import StepStructure from './components/StepStructure';
import StepPlan from './components/StepPlan';
import StepMapping from './components/StepMapping';
import StepRelations from './components/StepRelations';
import StepModules from './components/StepModules';
import StepNeedsMapping from './components/StepNeedsMapping';
import StepCourseReport from './components/StepCourseReport';
import { Modal, Button } from './components/ui/Elements';
import { Step } from './types';

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'IDENTITY', label: '1. ข้อมูลพื้นฐาน', icon: '🏫' },
  { id: 'OUTCOMES', label: '2. ผลลัพธ์ (PLOs)', icon: '🎯' },
  { id: 'NEEDS_MAPPING', label: '3. ความสัมพันธ์ Needs', icon: '🏗' },
  { id: 'STRUCTURE', label: '4. โครงสร้างหลักสูตร', icon: '📚' },
  { id: 'PLANNING', label: '5. แผนการเรียน', icon: '📅' },
  { id: 'MAPPING', label: '6. ความสัมพันธ์ PLO/CLO', icon: '🔗' },
  { id: 'RELATIONS', label: '7. ความสัมพันธ์ PLO/YLO', icon: '🕸' },
  { id: 'MODULES', label: '8. จัดชุดวิชา (Modules)', icon: '📦' },
  { id: 'REPORT', label: '9. รายงานรายวิชา (Report)', icon: '🖨' },
];

function App() {
  const { currentStep, setStep, state, loadState, clearState } = useCurriculum();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const renderStep = () => {
    switch (currentStep) {
      case 'IDENTITY': return <StepIdentity />;
      case 'OUTCOMES': return <StepOutcomes />;
      case 'NEEDS_MAPPING': return <StepNeedsMapping />;
      case 'STRUCTURE': return <StepStructure />;
      case 'PLANNING': return <StepPlan />;
      case 'MAPPING': return <StepMapping />;
      case 'RELATIONS': return <StepRelations />;
      case 'MODULES': return <StepModules />;
      case 'REPORT': return <StepCourseReport />;
      default: return <StepIdentity />;
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `curriculum_obe_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.info && json.courses) {
            loadState(json);
            alert("Curriculum data imported successfully!");
        } else {
            alert("Invalid file format.");
        }
      } catch (err) {
        alert("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmClear = () => {
    clearState();
    setIsClearModalOpen(false);
    setIsSidebarOpen(false);
  };

  const handleStepClick = (id: Step) => {
      setStep(id);
      setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-slate-50 text-slate-900">
      
      {/* Mobile Header & Overlay */}
      {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden print:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold tracking-tight">OBE Designer</h1>
                <p className="text-xs text-slate-400 mt-1">Thai Higher Education</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">✕</button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {STEPS.map((step) => (
                <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors text-left ${
                        currentStep === step.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <span>{step.icon}</span>
                    <span className="truncate">{step.label}</span>
                </button>
            ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800 space-y-2">
            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Actions</p>
            <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded transition-colors">
                ⬇ Export JSON
            </button>
            <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-2 rounded transition-colors">
                ⬆ Import JSON
            </button>
            <div className="pt-2 mt-2 border-t border-slate-800">
                <button onClick={() => setIsClearModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-red-900 hover:bg-red-800 text-red-100 text-xs py-2 rounded transition-colors">
                    🗑 Clear All Data
                </button>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
            />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full print:h-auto print:overflow-visible">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10 print:hidden">
            <div className="flex items-center gap-4">
                <button 
                    className="md:hidden text-slate-600 hover:text-slate-900"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    ☰
                </button>
                <h2 className="text-lg font-semibold text-slate-800">{STEPS.find(s => s.id === currentStep)?.label}</h2>
            </div>
            <div className="text-sm text-slate-500 hidden md:block truncate max-w-xs">
               {state.info.nameTH}
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 scroll-smooth print:p-0 print:overflow-visible">
            <div className="max-w-7xl mx-auto pb-10 print:max-w-none print:pb-0">
                {renderStep()}
            </div>
        </div>
      </main>

      {/* Clear Confirmation Modal */}
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Confirm Clear Data">
        <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">⚠️</div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">
                            Are you sure you want to clear all curriculum data?
                        </p>
                        <p className="text-xs text-red-600 mt-1 font-bold">
                            This action cannot be undone.
                        </p>
                    </div>
                </div>
            </div>
            <p className="text-sm text-slate-600">
                This will reset all inputs, PLOs, courses, and mappings to the initial state.
            </p>
            <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={confirmClear}>Yes, Clear Everything</Button>
            </div>
        </div>
      </Modal>

    </div>
  );
}

export default App;