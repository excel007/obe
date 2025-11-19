
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Card } from './ui/Elements';

const StepNeedsMapping = () => {
  const { state, togglePLOSource } = useCurriculum();
  const [viewMode, setViewMode] = useState<'NEEDS_ROW' | 'PLO_ROW'>('NEEDS_ROW');

  // Helper to get needs grouped by source
  const sources = Array.from(new Set(state.stakeholders.map(s => s.source)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">3. ความสัมพันธ์ Stakeholder Needs - PLO</h2>
        <div className="flex bg-slate-200 rounded p-1">
             <button 
                onClick={() => setViewMode('NEEDS_ROW')} 
                className={`px-3 py-1 rounded text-xs font-bold ${viewMode==='NEEDS_ROW' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}
            >
                View by Source
             </button>
             <button 
                onClick={() => setViewMode('PLO_ROW')} 
                className={`px-3 py-1 rounded text-xs font-bold ${viewMode==='PLO_ROW' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}
            >
                View by PLO
             </button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        {viewMode === 'NEEDS_ROW' ? (
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="p-3 border text-slate-700 min-w-[120px]">Source</th>
                        <th className="p-3 border text-slate-700 min-w-[300px]">Requirement / Need</th>
                        {state.plos.map(plo => (
                            <th key={plo.id} className="p-3 border text-center w-12 bg-blue-50 text-blue-800 text-xs cursor-help" title={plo.description}>
                                {plo.code}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sources.map(source => {
                        const needs = state.stakeholders.filter(s => s.source === source);
                        return needs.map((need, idx) => (
                            <tr key={need.id} className="border-b hover:bg-slate-50">
                                {idx === 0 && (
                                    <td rowSpan={needs.length} className="p-3 border align-top font-bold text-slate-600 bg-slate-50">
                                        {source}
                                    </td>
                                )}
                                <td className="p-3 border align-top text-slate-800 text-xs">{need.description}</td>
                                {state.plos.map(plo => {
                                    // Check based on PLO.sourceIds array
                                    const isChecked = plo.sourceIds?.includes(need.id);
                                    return (
                                        <td key={plo.id} className="p-2 border text-center align-middle">
                                            <input 
                                                type="checkbox" 
                                                checked={!!isChecked}
                                                onChange={() => togglePLOSource(plo.id, need.id)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                    )
                                })}
                            </tr>
                        ))
                    })}
                </tbody>
            </table>
        ) : (
            // View by PLO Row (Summary Matrix)
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="p-3 border text-slate-700 w-20">Code</th>
                        <th className="p-3 border text-slate-700">PLO Description</th>
                        {sources.map(s => (
                             <th key={s} className="p-3 border text-center w-24 text-xs text-slate-600">{s}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {state.plos.map(plo => (
                        <tr key={plo.id} className="border-b hover:bg-slate-50">
                            <td className="p-3 border font-bold text-blue-600 bg-blue-50">{plo.code}</td>
                            <td className="p-3 border text-xs">{plo.description}</td>
                            {sources.map(source => {
                                // Check if any need in this source maps to this PLO via sourceIds
                                const needs = state.stakeholders.filter(s => s.source === source);
                                const hasMapping = needs.some(n => plo.sourceIds?.includes(n.id));
                                return (
                                    <td key={source} className="p-3 border text-center">
                                        {hasMapping ? <span className="text-green-500 font-bold">●</span> : <span className="text-slate-200">−</span>}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </Card>

      {/* Reference Table */}
      <div className="mt-8">
          <h4 className="font-bold text-sm text-slate-500 mb-2">PLO Reference</h4>
          <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
             {state.plos.map(plo => (
                 <div key={plo.id} className="flex gap-2 text-xs">
                     <span className="font-bold text-blue-600 shrink-0">{plo.code}:</span>
                     <span className="text-slate-700">{plo.description}</span>
                 </div>
             ))}
          </div>
      </div>
    </div>
  );
};

export default StepNeedsMapping;
