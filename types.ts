
// Data Schema for OBE Curriculum Design

export enum CourseCategory {
  GEN_ED = "หมวดวิชาศึกษาทั่วไป",
  CORE = "วิชาแกน (2.1)",
  MAJOR_REQ = "วิชาเฉพาะบังคับ (2.2.1)",
  MAJOR_ELEC = "วิชาเฉพาะเลือก (2.2.2)",
  FIELD_EXP = "ประสบการณ์ภาคสนาม (2.2.3)",
  FREE_ELEC = "วิชาเลือกเสรี (2.3)"
}

export interface StakeholderInput {
  id: string;
  source: string; // Changed from enum union to string to support custom categories
  description: string;
}

export interface PLO {
  id: string;
  code: string; // PLO1
  description: string;
  suggested_domain?: string; // e.g., Cognitive, Psychomotor
  source_keywords?: string[]; // Keywords from stakeholders matched to this PLO
  sourceIds?: string[]; // IDs of StakeholderInput for direct traceability
}

export interface YLO {
  id: string;
  year: 1 | 2 | 3 | 4;
  description: string;
  mappedPLOs: string[]; // IDs of PLOs
}

export interface CLO {
  id: string;
  code: string; // CLO1
  actionVerb: string;
  description: string;
  bloomLevel: string; // e.g., Analyze, Create
  related_plo_code?: string; // The PLO code this CLO maps to
}

export interface Course {
  id: string;
  code: string;
  nameTH: string;
  nameEN: string;
  credits: number;
  category: CourseCategory;
  descriptionTH?: string;
  descriptionEN?: string;
  clos: CLO[];
  mappedYLOs?: string[]; // IDs of YLOs
  mappedPLOs?: string[]; // IDs of PLOs (Direct mapping)
}

export interface SemesterPlan {
  year: 1 | 2 | 3 | 4;
  semester: 1 | 2;
  courseIds: string[];
}

export interface CurriculumMapping {
  // Key: CourseID_YLOID, Value: boolean (is mapped)
  courseToYLO: Record<string, boolean>;
  // Key: YLOID_PLOID, Value: boolean (is mapped)
  yloToPlo: Record<string, boolean>;
  // Key: CourseID_PLOID, Value: boolean (Direct mapping via CLO, typically calculated or explicitly set)
  courseToPlo: Record<string, boolean>;
  // Key: StakeholderInputID_PLOID, Value: boolean (Deprecated in favor of PLO.sourceIds, kept for compatibility if needed)
  needsToPlo?: Record<string, boolean>;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  courseIds: string[]; // Subset of main curriculum
  prerequisites: Record<string, string[]>; // CourseID -> [PrereqCourseID]
}

export interface CreditStructure {
    total: number;
    genEd: number;
    core: number; // 2.1
    majorReq: number; // 2.2.1
    majorElec: number; // 2.2.2
    fieldExp: number; // 2.2.3
    freeElec: number; // 2.3
}

export interface CurriculumState {
  info: {
    nameTH: string;
    nameEN: string;
    degreeLevel: string;
    totalCredits: number;
    creditStructure: CreditStructure;
  };
  stakeholders: StakeholderInput[];
  customSources: string[]; // Store user-defined categories
  plos: PLO[];
  ylos: YLO[];
  courses: Course[];
  studyPlan: SemesterPlan[];
  mapping: CurriculumMapping;
  modules: Module[];
}

export type Step = 'IDENTITY' | 'OUTCOMES' | 'NEEDS_MAPPING' | 'STRUCTURE' | 'PLANNING' | 'MAPPING' | 'RELATIONS' | 'MODULES' | 'REPORT';