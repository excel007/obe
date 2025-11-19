
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CurriculumState, Step, Course, PLO, YLO, SemesterPlan, StakeholderInput, Module, CurriculumMapping } from '../types';

const initialSemesterPlan: SemesterPlan[] = [
  { year: 1, semester: 1, courseIds: [] },
  { year: 1, semester: 2, courseIds: [] },
  { year: 2, semester: 1, courseIds: [] },
  { year: 2, semester: 2, courseIds: [] },
  { year: 3, semester: 1, courseIds: [] },
  { year: 3, semester: 2, courseIds: [] },
  { year: 4, semester: 1, courseIds: [] },
  { year: 4, semester: 2, courseIds: [] },
];

const initialState: CurriculumState = {
  info: {
    nameTH: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์',
    nameEN: 'Bachelor of Science Program in Computer Science',
    degreeLevel: 'Bachelor',
    totalCredits: 120,
  },
  stakeholders: [],
  customSources: [],
  plos: [],
  ylos: [],
  courses: [],
  studyPlan: initialSemesterPlan,
  mapping: {
    courseToYLO: {},
    yloToPlo: {},
    courseToPlo: {},
    needsToPlo: {}
  },
  modules: []
};

interface CurriculumContextType {
  state: CurriculumState;
  currentStep: Step;
  setStep: (step: Step) => void;
  loadState: (newState: CurriculumState) => void;
  clearState: () => void;
  updateInfo: (info: Partial<CurriculumState['info']>) => void;
  addPLO: (plo: PLO) => void;
  updatePLO: (id: string, data: Partial<PLO>) => void;
  addYLO: (ylo: YLO) => void;
  updateYLO: (id: string, data: Partial<YLO>) => void;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  assignCourseToPlan: (courseId: string, year: number, semester: number) => void;
  toggleMapping: (type: 'course-ylo' | 'ylo-plo' | 'course-plo', id1: string, id2: string, forceValue?: boolean) => void;
  togglePLOSource: (ploId: string, sourceId: string) => void;
  addStakeholder: (s: StakeholderInput) => void;
  addSourceCategory: (source: string) => void;
  addModule: (m: Module) => void;
  updateModule: (id: string, data: Partial<Module>) => void;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [state, setState] = useState<CurriculumState>(initialState);
  const [currentStep, setCurrentStep] = useState<Step>('IDENTITY');

  const loadState = (newState: CurriculumState) => {
    setState(newState);
  };

  const clearState = () => {
    setState(initialState);
    setCurrentStep('IDENTITY');
  };

  const updateInfo = (info: Partial<CurriculumState['info']>) => {
    setState(prev => ({ ...prev, info: { ...prev.info, ...info } }));
  };

  const addStakeholder = (s: StakeholderInput) => {
    setState(prev => ({ ...prev, stakeholders: [...prev.stakeholders, s] }));
  }

  const addSourceCategory = (source: string) => {
    setState(prev => ({ ...prev, customSources: [...(prev.customSources || []), source] }));
  };

  const addPLO = (plo: PLO) => {
    setState(prev => ({ ...prev, plos: [...prev.plos, plo] }));
  };

  const updatePLO = (id: string, data: Partial<PLO>) => {
    setState(prev => ({
        ...prev,
        plos: prev.plos.map(p => p.id === id ? { ...p, ...data } : p)
    }));
  };

  const addYLO = (ylo: YLO) => {
    setState(prev => ({ ...prev, ylos: [...prev.ylos, ylo] }));
  };

  const updateYLO = (id: string, data: Partial<YLO>) => {
    setState(prev => ({
        ...prev,
        ylos: prev.ylos.map(y => y.id === id ? { ...y, ...data } : y)
    }));
  };

  const addCourse = (course: Course) => {
    setState(prev => ({ ...prev, courses: [...prev.courses, course] }));
  };

  const updateCourse = (id: string, data: Partial<Course>) => {
    setState(prev => ({
      ...prev,
      courses: prev.courses.map(c => c.id === id ? { ...c, ...data } : c)
    }));
  };

  const assignCourseToPlan = (courseId: string, year: number, semester: number) => {
    setState(prev => {
      const cleanPlan = prev.studyPlan.map(slot => ({
        ...slot,
        courseIds: slot.courseIds.filter(id => id !== courseId)
      }));
      
      const newPlan = cleanPlan.map(slot => {
        if (slot.year === year && slot.semester === semester) {
          return { ...slot, courseIds: [...slot.courseIds, courseId] };
        }
        return slot;
      });

      return { ...prev, studyPlan: newPlan };
    });
  };

  const toggleMapping = (type: 'course-ylo' | 'ylo-plo' | 'course-plo', id1: string, id2: string, forceValue?: boolean) => {
    const key = `${id1}_${id2}`;
    setState(prev => {
      let targetMap: Record<string, boolean>;
      let mapKey: keyof CurriculumMapping;

      if (type === 'course-ylo') {
        targetMap = prev.mapping.courseToYLO;
        mapKey = 'courseToYLO';
      } else if (type === 'ylo-plo') {
        targetMap = prev.mapping.yloToPlo;
        mapKey = 'yloToPlo';
      } else {
        targetMap = prev.mapping.courseToPlo;
        mapKey = 'courseToPlo';
      }

      const newValue = forceValue !== undefined ? forceValue : !targetMap[key];
      
      return {
        ...prev,
        mapping: {
          ...prev.mapping,
          [mapKey]: {
            ...targetMap,
            [key]: newValue
          }
        }
      };
    });
  };

  // New Action: Toggle PLO Source directly in PLO object
  const togglePLOSource = (ploId: string, sourceId: string) => {
    setState(prev => ({
        ...prev,
        plos: prev.plos.map(p => {
            if (p.id !== ploId) return p;
            const currentSources = p.sourceIds || [];
            const newSources = currentSources.includes(sourceId)
                ? currentSources.filter(id => id !== sourceId)
                : [...currentSources, sourceId];
            return { ...p, sourceIds: newSources };
        })
    }));
  };

  const addModule = (m: Module) => {
    setState(prev => ({ ...prev, modules: [...prev.modules, m] }));
  }

  const updateModule = (id: string, data: Partial<Module>) => {
    setState(prev => ({
        ...prev,
        modules: prev.modules.map(m => m.id === id ? { ...m, ...data } : m)
    }));
  }

  return (
    <CurriculumContext.Provider value={{ 
      state, 
      currentStep, 
      setStep: setCurrentStep,
      loadState,
      clearState,
      updateInfo,
      addPLO,
      updatePLO,
      addYLO,
      updateYLO,
      addCourse,
      updateCourse,
      assignCourseToPlan,
      toggleMapping,
      togglePLOSource,
      addStakeholder,
      addSourceCategory,
      addModule,
      updateModule
    }}>
      {children}
    </CurriculumContext.Provider>
  );
};

export const useCurriculum = () => {
  const context = useContext(CurriculumContext);
  if (!context) throw new Error("useCurriculum must be used within CurriculumProvider");
  return context;
};
