
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Button, Input, Card, Textarea, Badge, Spinner } from './ui/Elements';
import { suggestPLOs, suggestYLOs } from '../services/geminiService';
import { PLO } from '../types';

const StepOutcomes = () => {
  const { state, addPLO, updatePLO, addYLO, updateYLO, loadState } = useCurriculum();
  const [ploDesc, setPloDesc] = useState('');
  
  // AI Suggestion State
  const [isSuggestingPLO, setIsSuggestingPLO] = useState(false);
  const [suggestedPLOs, setSuggestedPLOs] = useState<PLO[]>([]);
  const [showPLOSuggestions, setShowPLOSuggestions] = useState(false);
  const [isSuggestingYLO, setIsSuggestingYLO] = useState(false);

  // Edit State
  const [editingPLO, setEditingPLO] = useState<{id: string, text: string} | null>(null);
  const [editingYLO, setEditingYLO] = useState<{id: string, text: string} | null>(null);

  const handleAddPLO = () => {
    if (!ploDesc) return;
    const id = (state.plos.length + 1).toString();
    addPLO({
      id: `PLO-${id}`,
      code: `PLO${id}`,
      description: ploDesc,
      sourceIds: []
    });
    setPloDesc('');
  };

  const handleUpdatePLO = () => {
      if(editingPLO) {
          updatePLO(editingPLO.id, { description: editingPLO.text });
          setEditingPLO(null);
      }
  }

  const removePLO = (id: string) => {
      const updated = state.plos.filter(p => p.id !== id);
      loadState({ ...state, plos: updated });
  };

  const removeYLO = (id: string) => {
      const updated = state.ylos.filter(y => y.id !== id);
      loadState({ ...state, ylos: updated });
  };

  const handleUpdateYLO = () => {
      if(editingYLO) {
          updateYLO(editingYLO.id, { description: editingYLO.text });
          setEditingYLO(null);
      }
  }

  const handleSuggestPLOs = async () => {
    if (state.stakeholders.length === 0) {
        alert("Please add stakeholder needs in Step 1 first.");
        return;
    }
    setIsSuggestingPLO(true);
    setShowPLOSuggestions(true);
    try {
        const suggestions = await suggestPLOs(state.stakeholders, state.info.nameTH, state.info.degreeLevel);
        const formattedSuggestions: PLO[] = suggestions.map((s: any, idx: number) => ({
            id: `SUG-${Date.now()}-${idx}`,
            code: `Draft-${idx+1}`,
            description: s.description,
            suggested_domain: s.suggested_domain,
            source_keywords: s.source_keywords,
            sourceIds: s.sourceIds || [] // Map returned IDs
        }));
        setSuggestedPLOs(formattedSuggestions);
    } catch (error) {
        alert("Failed to generate suggestions. Please try again.");
    } finally {
        setIsSuggestingPLO(false);
    }
  };

  const acceptSuggestion = (plo: PLO) => {
    const nextId = state.plos.length + 1;
    addPLO({
        ...plo,
        id: `PLO-${nextId}`,
        code: `PLO${nextId}` // Re-index properly
    });
    setSuggestedPLOs(prev => prev.filter(p => p.id !== plo.id));
  };

  const removeSuggestion = (id: string) => {
    setSuggestedPLOs(prev => prev.filter(p => p.id !== id));
  };

  const handleSuggestYLOs = async () => {
    setIsSuggestingYLO(true);
    try {
        const results = await suggestYLOs(state.info.degreeLevel, state.info.nameTH);
        results.forEach((y: any) => {
            addYLO({
                id: `YLO-${Date.now()}-${y.year}`,
                year: y.year,
                description: y.description,
                mappedPLOs: []
            })
        });
    } catch (e) {
        alert("Failed to suggest YLOs");
    } finally {
        setIsSuggestingYLO(false);
    }
  };

  const [ylo, setYlo] = useState({ year: 1, desc: '' });
  const handleAddYLO = () => {
    if (!ylo.desc) return;
    addYLO({
        id: `YLO-${Date.now()}`,
        year: ylo.year as any,
        description: ylo.desc,
        mappedPLOs: []
    });
    setYlo({ ...ylo, desc: '' });
  };

  return (
    <div className="space-y-6">
      <Card title="2.1 Program Learning Outcomes (PLOs)">
        <div className="mb-4">
            <p className="text-sm text-slate-500 mb-2">ผลลัพธ์การเรียนรู้ของหลักสูตร (สิ่งที่นักศึกษาทำได้เมื่อจบการศึกษา)</p>
            
            {/* Manual Add */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1">
                    <Textarea 
                        placeholder="เช่น สามารถประยุกต์ใช้ AI ในการแก้ปัญหาทางธุรกิจ..."
                        value={ploDesc}
                        onChange={(e: any) => setPloDesc(e.target.value)}
                    />
                </div>
                <Button className="h-fit mt-6" onClick={handleAddPLO}>เพิ่ม PLO</Button>
            </div>

            {/* AI Suggestion Trigger */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="text-blue-800 font-bold text-sm">✨ AI Assistant: PLO Synthesis</h4>
                        <p className="text-blue-600 text-xs mt-1">
                            วิเคราะห์ความต้องการจาก Stakeholders ({state.stakeholders.length} รายการ) เพื่อร่าง PLO
                        </p>
                    </div>
                    <Button 
                        variant="secondary" 
                        onClick={handleSuggestPLOs}
                        disabled={isSuggestingPLO || state.stakeholders.length === 0}
                        className="text-sm w-40"
                    >
                        {isSuggestingPLO ? <><Spinner /> Thinking...</> : '⚡ Suggest PLOs'}
                    </Button>
                </div>

                {/* Suggestions List */}
                {showPLOSuggestions && (
                    <div className="mt-4 space-y-3">
                        {isSuggestingPLO && <p className="text-slate-500 text-sm italic text-center py-4">กำลังวิเคราะห์ข้อมูลและร่าง PLO...</p>}
                        {!isSuggestingPLO && suggestedPLOs.length === 0 && <p className="text-slate-500 text-sm text-center">No suggestions generated.</p>}
                        
                        {suggestedPLOs.map((plo) => (
                            <div key={plo.id} className="bg-white p-3 rounded border border-blue-200 shadow-sm animate-fade-in">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge color="purple">{plo.suggested_domain}</Badge>
                                            <span className="text-xs text-slate-400">From: {plo.source_keywords?.join(', ')}</span>
                                            {/* Debug/Info: Show linked ID count */}
                                            <span className="text-xs text-slate-400 ml-1" title="Linked Stakeholder Needs">({plo.sourceIds?.length || 0} Links)</span>
                                        </div>
                                        <p className="text-slate-800 text-sm font-medium">{plo.description}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button variant="primary" className="px-2 py-1 text-xs h-8" onClick={() => acceptSuggestion(plo)}>Use</Button>
                                        <Button variant="ghost" className="px-2 py-1 text-xs h-8 text-red-400 hover:text-red-600" onClick={() => removeSuggestion(plo.id)}>✕</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Current PLOs List */}
        <div className="space-y-2">
            {state.plos.map((plo) => (
                <div key={plo.id} className="flex gap-3 p-3 bg-slate-50 rounded border border-slate-200 group">
                    <span className="font-bold text-blue-600 w-12 shrink-0 mt-1">{plo.code}</span>
                    <div className="flex-1">
                        {editingPLO?.id === plo.id ? (
                             <Textarea 
                                value={editingPLO.text}
                                onChange={(e: any) => setEditingPLO({...editingPLO, text: e.target.value})}
                                rows={2}
                             />
                        ) : (
                            <>
                                <p className="text-slate-800">{plo.description}</p>
                                {plo.suggested_domain && (
                                    <div className="mt-1 flex gap-2">
                                        <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-600">{plo.suggested_domain}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex gap-1">
                        {editingPLO?.id === plo.id ? (
                            <Button className="px-2 py-1 text-xs h-8 bg-green-600 hover:bg-green-700" onClick={handleUpdatePLO}>Save</Button>
                        ) : (
                            <button onClick={() => setEditingPLO({id: plo.id, text: plo.description})} className="text-slate-400 hover:text-blue-500 text-sm">✎</button>
                        )}
                        <button onClick={() => removePLO(plo.id)} className="text-slate-400 hover:text-red-500 text-sm">🗑</button>
                    </div>
                </div>
            ))}
        </div>
      </Card>

      <Card title="2.2 Year Learning Outcomes (YLOs)">
        <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">กำหนดผลลัพธ์การเรียนรู้รายปี</p>
            <Button variant="secondary" className="text-xs w-48" onClick={handleSuggestYLOs} disabled={isSuggestingYLO}>
                {isSuggestingYLO ? <><Spinner /> Thinking...</> : '🤖 AI Suggest YLOs (CS)'}
            </Button>
        </div>
        
        <div className="mb-4 flex gap-4 items-end">
             <div className="w-24">
                <label className="text-sm text-slate-700 font-medium">ชั้นปีที่</label>
                <select 
                    className="w-full border border-slate-300 rounded p-2"
                    value={ylo.year}
                    onChange={(e) => setYlo({...ylo, year: parseInt(e.target.value)})}
                >
                    <option value="1">ปี 1</option>
                    <option value="2">ปี 2</option>
                    <option value="3">ปี 3</option>
                    <option value="4">ปี 4</option>
                </select>
             </div>
             <div className="flex-1">
                <Input 
                    placeholder="ผลลัพธ์การเรียนรู้ประจำชั้นปี..."
                    value={ylo.desc}
                    onChange={(e: any) => setYlo({...ylo, desc: e.target.value})}
                />
             </div>
             <Button onClick={handleAddYLO}>เพิ่ม</Button>
        </div>
        <div className="space-y-2">
            {[1,2,3,4].map(year => {
                const ylos = state.ylos.filter(y => y.year === year);
                if (ylos.length === 0 && !isSuggestingYLO) return null;
                return (
                    <div key={year} className="mb-2">
                        <h4 className="font-bold text-slate-700 mb-1">ชั้นปีที่ {year}</h4>
                        {ylos.map(y => (
                            <div key={y.id} className="ml-4 p-2 bg-slate-50 border-l-4 border-green-400 text-sm mb-1 flex justify-between items-start group">
                                <div className="flex-1">
                                    {editingYLO?.id === y.id ? (
                                        <Textarea 
                                            value={editingYLO.text}
                                            onChange={(e: any) => setEditingYLO({...editingYLO, text: e.target.value})}
                                            rows={2}
                                        />
                                    ) : (
                                        <span>{y.description}</span>
                                    )}
                                </div>
                                <div className="flex gap-2 ml-2">
                                    {editingYLO?.id === y.id ? (
                                        <button onClick={handleUpdateYLO} className="text-green-600 text-xs font-bold">Save</button>
                                    ) : (
                                        <button onClick={() => setEditingYLO({id: y.id, text: y.description})} className="text-slate-300 hover:text-blue-500 text-xs">✎</button>
                                    )}
                                    <button onClick={() => removeYLO(y.id)} className="text-slate-300 hover:text-red-500 text-xs">🗑</button>
                                </div>
                            </div>
                        ))}
                        {ylos.length === 0 && <p className="text-xs text-slate-400 ml-4">ยังไม่มี YLO</p>}
                    </div>
                )
            })}
        </div>
      </Card>
    </div>
  );
};

export default StepOutcomes;
