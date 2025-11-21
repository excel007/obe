
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Button, Input, Card, Textarea, Modal } from './ui/Elements';
import { StakeholderInput } from '../types';

const StepIdentity = () => {
  const { state, updateInfo, addStakeholder, addSourceCategory, loadState } = useCurriculum();
  const [newStakeholder, setNewStakeholder] = useState<Partial<StakeholderInput>>({ source: 'Employers', description: '' });
  
  // Custom Category State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const defaultSources = ['กลุ่มผู้ประกอบการ (Employers & Industry Partners)', 'ศิษย์เก่า (Alumni)', 'นักศึกษาและผู้สนใจเข้าศึกษา (Students)', 'สถานการณ์โลกและแนวโน้มสำคัญ (Global Mega Trends)', 'แผนยุทธศาสตร์/นโยบาย (Strategic)', 'มาตรฐานที่เกี่ยวข้อง (Standards)'];
  const allSources = [...defaultSources, ...(state.customSources || [])];

  const handleAddStakeholder = () => {
    if (!newStakeholder.description) return;
    addStakeholder({
      id: Date.now().toString(),
      source: newStakeholder.source || 'กลุ่มผู้ประกอบการ (Employers & Industry Partners)',
      description: newStakeholder.description || ''
    });
    setNewStakeholder({ ...newStakeholder, description: '' });
  };

  const removeStakeholder = (id: string) => {
    const updated = state.stakeholders.filter(s => s.id !== id);
    loadState({ ...state, stakeholders: updated });
  };

  const handleAddCategory = () => {
      if(newCategoryName.trim()) {
          addSourceCategory(newCategoryName.trim());
          setNewStakeholder({...newStakeholder, source: newCategoryName.trim()});
          setNewCategoryName('');
          setIsAddCategoryOpen(false);
      }
  };

  const handleCreditStructureChange = (field: keyof typeof state.info.creditStructure, value: string) => {
      const numVal = parseInt(value) || 0;
      updateInfo({
          creditStructure: {
              ...state.info.creditStructure,
              [field]: numVal
          }
      });
      // Also update total credits if 'total' field changes, or calculate it? 
      // Requirement implies separate inputs.
      if(field === 'total') {
          updateInfo({ totalCredits: numVal });
      }
  };

  return (
    <div className="space-y-6">
      <Card title="1. ข้อมูลทั่วไปของหลักสูตร (Curriculum Identity)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="ชื่อหลักสูตร (TH)" 
            value={state.info.nameTH} 
            onChange={(e: any) => updateInfo({ nameTH: e.target.value })} 
          />
          <Input 
            label="Curriculum Name (EN)" 
            value={state.info.nameEN} 
            onChange={(e: any) => updateInfo({ nameEN: e.target.value })} 
          />
          <Input 
            label="ระดับปริญญา (Degree Level)" 
            value={state.info.degreeLevel} 
            onChange={(e: any) => updateInfo({ degreeLevel: e.target.value })} 
          />
          <Input 
            label="จำนวนหน่วยกิตรวม (Total Credits)" 
            type="number"
            value={state.info.totalCredits} 
            onChange={(e: any) => handleCreditStructureChange('total', e.target.value)} 
          />
        </div>
      </Card>

      <Card title="โครงสร้างหลักสูตร (Standard Credit Structure)">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-2">1. หมวดวิชาศึกษาทั่วไป</h4>
                  <Input 
                    type="number" 
                    value={state.info.creditStructure?.genEd} 
                    onChange={(e: any) => handleCreditStructureChange('genEd', e.target.value)} 
                  />
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-2">2.1 กลุ่มวิชาพื้นฐานวิชาชีพ</h4>
                  <Input 
                    type="number" 
                    value={state.info.creditStructure?.core} 
                    onChange={(e: any) => handleCreditStructureChange('core', e.target.value)} 
                  />
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-2">2.2.1 กลุ่มวิชาบังคับ</h4>
                  <Input 
                    type="number" 
                    value={state.info.creditStructure?.majorReq} 
                    onChange={(e: any) => handleCreditStructureChange('majorReq', e.target.value)} 
                  />
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-2">2.2.2 กลุ่มวิชาเลือก</h4>
                  <Input 
                    type="number" 
                    value={state.info.creditStructure?.majorElec} 
                    onChange={(e: any) => handleCreditStructureChange('majorElec', e.target.value)} 
                  />
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-2">2.2.3 ฝึกประสบการณ์ฯ</h4>
                  <Input 
                    type="number" 
                    value={state.info.creditStructure?.fieldExp} 
                    onChange={(e: any) => handleCreditStructureChange('fieldExp', e.target.value)} 
                  />
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-2">2.3 หมวดวิชาเลือกเสรี</h4>
                  <Input 
                    type="number" 
                    value={state.info.creditStructure?.freeElec} 
                    onChange={(e: any) => handleCreditStructureChange('freeElec', e.target.value)} 
                  />
              </div>
          </div>
      </Card>

      <Card title="2. ความต้องการของผู้มีส่วนได้ส่วนเสีย (Stakeholder Needs)">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
          <div className="w-full md:w-1/3">
             <div className="flex justify-between items-baseline mb-1">
                <label className="text-sm font-medium text-slate-700">แหล่งที่มา (Source)</label>
                <button onClick={() => setIsAddCategoryOpen(true)} className="text-[10px] text-blue-600 hover:underline font-bold">+ Add Category</button>
             </div>
             <select 
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900"
                value={newStakeholder.source}
                onChange={(e) => setNewStakeholder({...newStakeholder, source: e.target.value})}
             >
                {allSources.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
          <div className="w-full md:w-2/3">
            <Textarea 
                label="ความต้องการ / ข้อเสนอแนะ (Description)"
                placeholder="ระบุทักษะหรือความรู้ที่ต้องการ..."
                value={newStakeholder.description}
                onChange={(e: any) => setNewStakeholder({...newStakeholder, description: e.target.value})}
                rows={4}
            />
          </div>
          <Button className="mt-7 h-10" onClick={handleAddStakeholder}>เพิ่ม</Button>
        </div>

        <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
            {state.stakeholders.length === 0 && <p className="text-slate-400 italic text-sm">ยังไม่มีข้อมูลนำเข้า</p>}
            {state.stakeholders.map((s) => (
                <div key={s.id} className="flex items-start gap-3 bg-white p-3 rounded border border-slate-200 shadow-sm group">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded shrink-0 w-32 text-center truncate" title={s.source}>
                        {s.source}
                    </span>
                    <p className="text-sm text-slate-700 flex-1 whitespace-pre-wrap">{s.description}</p>
                    <button 
                        onClick={() => removeStakeholder(s.id)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        🗑
                    </button>
                </div>
            ))}
        </div>
      </Card>

      <Modal isOpen={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} title="Add New Source Category">
            <div className="flex flex-col gap-4">
                <Input 
                    label="Category Name"
                    value={newCategoryName}
                    onChange={(e: any) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Parents, Local Community"
                />
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddCategory}>Add</Button>
                </div>
            </div>
      </Modal>
    </div>
  );
};

export default StepIdentity;
