/**
 * Resume Templates Index
 *
 * 15 Professional Templates with Photo Support for Senior/Leadership roles
 * Export all templates and template metadata
 */
import { ModernTemplate } from "./ModernTemplate";
import { ProfessionalTemplate } from "./ProfessionalTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { ExecutiveTemplate } from "./ExecutiveTemplate";
import { CorporateTemplate } from "./CorporateTemplate";
import { TechModernTemplate } from "./TechModernTemplate";
import { SalesLeaderTemplate } from "./SalesLeaderTemplate";
import { SeniorExecutiveTemplate } from "./SeniorExecutiveTemplate";
import { ATSOptimizedTemplate } from "./ATSOptimizedTemplate";
import { OperationsTemplate } from "./OperationsTemplate";
import { FinanceProTemplate } from "./FinanceProTemplate";
import { CreativeTemplate } from "./CreativeTemplate";
import { ConsultantTemplate } from "./ConsultantTemplate";
import { ManagerTemplate } from "./ManagerTemplate";
import { GraduateTemplate } from "./GraduateTemplate";
import { TemplateId, ResumeData } from "@/contexts/ResumeContext";

// Template metadata for selection UI
export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  previewImage?: string;
  tags: string[];
  supportsPhoto?: boolean;
  category: "Professional" | "Executive" | "Industry" | "Entry Level";
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  // ==================
  // PROFESSIONAL CATEGORY
  // ==================
  modern: {
    id: "modern",
    name: "Modern",
    description: "Clean, contemporary design with sidebar layout",
    tags: ["Tech", "Startups", "Creative"],
    category: "Professional",
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "Classic, traditional ATS-friendly format",
    tags: ["Corporate", "Finance", "Legal"],
    category: "Professional",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean design with focus on content",
    tags: ["Design", "Creative", "Marketing"],
    category: "Professional",
  },
  "ats-optimized": {
    id: "ats-optimized",
    name: "ATS Optimized",
    description: "Maximum ATS compatibility for job portal applications",
    tags: ["All Industries", "Job Portals", "ATS-Friendly"],
    category: "Professional",
  },
  "tech-modern": {
    id: "tech-modern",
    name: "Tech Modern",
    description: "Sleek design for software engineers and tech professionals",
    tags: ["Engineering", "Software", "Data Science"],
    category: "Professional",
  },

  // ==================
  // EXECUTIVE & LEADERSHIP CATEGORY
  // ==================
  executive: {
    id: "executive",
    name: "Executive",
    description: "Bold, commanding design for senior roles",
    tags: ["Leadership", "Management", "C-Suite"],
    supportsPhoto: true,
    category: "Executive",
  },
  "senior-executive": {
    id: "senior-executive",
    name: "Senior Executive",
    description: "Premium design for C-Suite and VP-level professionals",
    tags: ["CEO", "COO", "CFO", "VP", "Director"],
    supportsPhoto: true,
    category: "Executive",
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    description: "Traditional corporate format for large enterprises",
    tags: ["Banking", "Finance", "Consulting"],
    supportsPhoto: true,
    category: "Executive",
  },
  manager: {
    id: "manager",
    name: "Manager",
    description: "Leadership-focused design with team achievements",
    tags: ["Team Lead", "Manager", "Supervisor"],
    supportsPhoto: true,
    category: "Executive",
  },

  // ==================
  // INDUSTRY-SPECIFIC CATEGORY
  // ==================
  "sales-leader": {
    id: "sales-leader",
    name: "Sales Leader",
    description: "Results-focused design with metrics emphasis",
    tags: ["Sales", "Business Development", "Account Management"],
    supportsPhoto: true,
    category: "Industry",
  },
  operations: {
    id: "operations",
    name: "Operations",
    description: "Process and efficiency focused design",
    tags: ["Operations", "Supply Chain", "Manufacturing"],
    supportsPhoto: true,
    category: "Industry",
  },
  "finance-pro": {
    id: "finance-pro",
    name: "Finance Pro",
    description: "Professional design for finance professionals",
    tags: ["Finance", "Accounting", "Investment"],
    supportsPhoto: true,
    category: "Industry",
  },
  consultant: {
    id: "consultant",
    name: "Consultant",
    description: "Prestigious design for consulting professionals",
    tags: ["Consulting", "Strategy", "Advisory"],
    category: "Industry",
  },
  creative: {
    id: "creative",
    name: "Creative",
    description: "Bold, modern design for creative professionals",
    tags: ["Design", "Marketing", "Brand", "Content"],
    category: "Industry",
  },

  // ==================
  // ENTRY LEVEL CATEGORY
  // ==================
  graduate: {
    id: "graduate",
    name: "Graduate",
    description: "Clean design for entry-level professionals",
    tags: ["Fresh Graduate", "Intern", "Entry Level"],
    category: "Entry Level",
  },
};

// Template component map
export const TEMPLATE_COMPONENTS: Record<TemplateId, React.ComponentType<{ data: ResumeData; scale?: number }>> = {
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
  minimal: MinimalTemplate,
  executive: ExecutiveTemplate,
  corporate: CorporateTemplate,
  "tech-modern": TechModernTemplate,
  "sales-leader": SalesLeaderTemplate,
  operations: OperationsTemplate,
  "finance-pro": FinanceProTemplate,
  creative: CreativeTemplate,
  consultant: ConsultantTemplate,
  "ats-optimized": ATSOptimizedTemplate,
  "senior-executive": SeniorExecutiveTemplate,
  manager: ManagerTemplate,
  graduate: GraduateTemplate,
};

// Get template component by ID
export function getTemplateComponent(templateId: TemplateId) {
  return TEMPLATE_COMPONENTS[templateId] || ModernTemplate;
}

// Get templates by category
export function getTemplatesByCategory(category: TemplateMeta["category"]) {
  return Object.values(TEMPLATES).filter(t => t.category === category);
}

// Get templates that support photo
export function getPhotoTemplates() {
  return Object.values(TEMPLATES).filter(t => t.supportsPhoto);
}

// Export all templates
export {
  ModernTemplate,
  ProfessionalTemplate,
  MinimalTemplate,
  ExecutiveTemplate,
  CorporateTemplate,
  TechModernTemplate,
  SalesLeaderTemplate,
  SeniorExecutiveTemplate,
  ATSOptimizedTemplate,
  OperationsTemplate,
  FinanceProTemplate,
  CreativeTemplate,
  ConsultantTemplate,
  ManagerTemplate,
  GraduateTemplate,
};
