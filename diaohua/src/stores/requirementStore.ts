import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Requirement, Screenshot, MockupDesign, Annotation, AIGeneratedContent, PRDVersion } from '@/types';

interface RequirementState {
  requirements: Requirement[];
  currentRequirement: Requirement | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createRequirement: (title: string, description?: string) => Requirement;
  updateRequirement: (id: string, updates: Partial<Requirement>) => void;
  deleteRequirement: (id: string) => void;
  setCurrentRequirement: (requirement: Requirement | null) => void;
  getRequirementById: (id: string) => Requirement | undefined;
  
  // Screenshot actions
  addScreenshot: (requirementId: string, screenshot: Screenshot) => void;
  updateScreenshot: (requirementId: string, screenshotId: string, updates: Partial<Screenshot>) => void;
  removeScreenshot: (requirementId: string, screenshotId: string) => void;
  updateAnnotations: (requirementId: string, screenshotId: string, annotations: Annotation[]) => void;
  reorderScreenshots: (requirementId: string, newOrder: string[]) => void;
  
  // Mockup actions
  addMockupDesigns: (requirementId: string, mockups: MockupDesign[]) => void;
  selectMockup: (requirementId: string, mockupId: string) => void;
  
  // PRD actions
  savePRDContent: (requirementId: string, content: AIGeneratedContent, changeSummary?: string) => void;
  restorePRDVersion: (requirementId: string, version: PRDVersion) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useRequirementStore = create<RequirementState>()(
  persist(
    (set, get) => ({
      requirements: [],
      currentRequirement: null,
      isLoading: false,
      error: null,
      
      createRequirement: (title: string, description?: string) => {
        const newRequirement: Requirement = {
          id: generateId(),
          projectId: 'default-project',
          title,
          status: 'draft',
          priority: 'medium',
          creatorId: 'current-user',
          tags: [],
          screenshots: [],
          userDescription: description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          requirements: [newRequirement, ...state.requirements],
          currentRequirement: newRequirement,
        }));
        return newRequirement;
      },
      
      updateRequirement: (id: string, updates: Partial<Requirement>) => {
        set((state) => ({
          requirements: state.requirements.map((req) =>
            req.id === id
              ? { ...req, ...updates, updatedAt: new Date().toISOString() }
              : req
          ),
          currentRequirement:
            state.currentRequirement?.id === id
              ? { ...state.currentRequirement, ...updates, updatedAt: new Date().toISOString() }
              : state.currentRequirement,
        }));
      },
      
      deleteRequirement: (id: string) => {
        set((state) => ({
          requirements: state.requirements.filter((req) => req.id !== id),
          currentRequirement:
            state.currentRequirement?.id === id ? null : state.currentRequirement,
        }));
      },
      
      setCurrentRequirement: (requirement: Requirement | null) => {
        set({ currentRequirement: requirement });
      },
      
      getRequirementById: (id: string) => {
        return get().requirements.find((req) => req.id === id);
      },
      
      addScreenshot: (requirementId: string, screenshot: Screenshot) => {
        set((state) => ({
          requirements: state.requirements.map((req) =>
            req.id === requirementId
              ? {
                  ...req,
                  screenshots: [...req.screenshots, screenshot],
                  status: 'annotating',
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentRequirement:
            state.currentRequirement?.id === requirementId
              ? {
                  ...state.currentRequirement,
                  screenshots: [...state.currentRequirement.screenshots, screenshot],
                  status: 'annotating',
                }
              : state.currentRequirement,
        }));
      },
      
      updateScreenshot: (requirementId: string, screenshotId: string, updates: Partial<Screenshot>) => {
        set((state) => ({
          requirements: state.requirements.map((req) =>
            req.id === requirementId
              ? {
                  ...req,
                  screenshots: req.screenshots.map((s) =>
                    s.id === screenshotId ? { ...s, ...updates } : s
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentRequirement:
            state.currentRequirement?.id === requirementId
              ? {
                  ...state.currentRequirement,
                  screenshots: state.currentRequirement.screenshots.map((s) =>
                    s.id === screenshotId ? { ...s, ...updates } : s
                  ),
                }
              : state.currentRequirement,
        }));
      },
      
      removeScreenshot: (requirementId: string, screenshotId: string) => {
        set((state) => ({
          requirements: state.requirements.map((req) =>
            req.id === requirementId
              ? {
                  ...req,
                  screenshots: req.screenshots.filter((s) => s.id !== screenshotId),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentRequirement:
            state.currentRequirement?.id === requirementId
              ? {
                  ...state.currentRequirement,
                  screenshots: state.currentRequirement.screenshots.filter(
                    (s) => s.id !== screenshotId
                  ),
                }
              : state.currentRequirement,
        }));
      },
      
      updateAnnotations: (requirementId: string, screenshotId: string, annotations: Annotation[]) => {
        set((state) => ({
          requirements: state.requirements.map((req) =>
            req.id === requirementId
              ? {
                  ...req,
                  screenshots: req.screenshots.map((s) =>
                    s.id === screenshotId ? { ...s, annotations } : s
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentRequirement:
            state.currentRequirement?.id === requirementId
              ? {
                  ...state.currentRequirement,
                  screenshots: state.currentRequirement.screenshots.map((s) =>
                    s.id === screenshotId ? { ...s, annotations } : s
                  ),
                }
              : state.currentRequirement,
        }));
      },
      
      reorderScreenshots: (requirementId: string, newOrder: string[]) => {
        set((state) => {
          const req = state.requirements.find((r) => r.id === requirementId);
          if (!req) return state;
          
          const screenshotMap = new Map(req.screenshots.map((s) => [s.id, s]));
          const reorderedScreenshots = newOrder
            .map((id) => screenshotMap.get(id))
            .filter((s): s is Screenshot => !!s)
            .map((s, index) => ({ ...s, order: index }));
          
          return {
            requirements: state.requirements.map((r) =>
              r.id === requirementId
                ? { ...r, screenshots: reorderedScreenshots, updatedAt: new Date().toISOString() }
                : r
            ),
            currentRequirement:
              state.currentRequirement?.id === requirementId
                ? { ...state.currentRequirement, screenshots: reorderedScreenshots }
                : state.currentRequirement,
          };
        });
      },
      
      addMockupDesigns: (requirementId: string, mockups: MockupDesign[]) => {
        set((state) => ({
          requirements: state.requirements.map((req) =>
            req.id === requirementId
              ? {
                  ...req,
                  mockupDesigns: [...(req.mockupDesigns || []), ...mockups],
                  status: 'mockup_review',
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentRequirement:
            state.currentRequirement?.id === requirementId
              ? {
                  ...state.currentRequirement,
                  mockupDesigns: [...(state.currentRequirement.mockupDesigns || []), ...mockups],
                  status: 'mockup_review',
                }
              : state.currentRequirement,
        }));
      },
      
      selectMockup: (requirementId: string, mockupId: string) => {
        set((state) => ({
          requirements: state.requirements.map((req) =>
            req.id === requirementId
              ? {
                  ...req,
                  mockupDesigns: (req.mockupDesigns || []).map((m) => ({
                    ...m,
                    selected: m.id === mockupId,
                  })),
                  selectedMockupId: mockupId,
                  status: 'designing',
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentRequirement:
            state.currentRequirement?.id === requirementId
              ? {
                  ...state.currentRequirement,
                  mockupDesigns: (state.currentRequirement.mockupDesigns || []).map((m) => ({
                    ...m,
                    selected: m.id === mockupId,
                  })),
                  selectedMockupId: mockupId,
                  status: 'designing',
                }
              : state.currentRequirement,
        }));
      },

      savePRDContent: (requirementId: string, content: AIGeneratedContent, changeSummary?: string) => {
        set((state) => {
          const req = state.requirements.find((r) => r.id === requirementId);
          const currentReq = state.currentRequirement;
          
          // 如果已有 AI 生成内容，保存到历史版本
          const existingVersions = req?.prdVersions || [];
          let newVersions = existingVersions;
          
          if (req?.aiGeneratedContent) {
            const version: PRDVersion = {
              id: `prd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              content: req.aiGeneratedContent,
              createdAt: req.aiGeneratedContent.generatedAt,
              createdBy: 'AI',
              changeSummary: changeSummary || '历史版本',
            };
            newVersions = [...existingVersions, version];
          }

          return {
            requirements: state.requirements.map((r) =>
              r.id === requirementId
                ? {
                    ...r,
                    aiGeneratedContent: content,
                    prdVersions: newVersions,
                    status: 'mockup_review',
                    updatedAt: new Date().toISOString(),
                  }
                : r
            ),
            currentRequirement:
              currentReq?.id === requirementId
                ? {
                    ...currentReq,
                    aiGeneratedContent: content,
                    prdVersions: newVersions,
                    status: 'mockup_review',
                  }
                : currentReq,
          };
        });
      },

      restorePRDVersion: (requirementId: string, version: PRDVersion) => {
        set((state) => {
          const req = state.requirements.find((r) => r.id === requirementId);
          if (!req) return state;

          // 将当前版本保存到历史
          const currentVersions = req.prdVersions || [];
          let updatedVersions = currentVersions;
          
          if (req.aiGeneratedContent) {
            const currentVersion: PRDVersion = {
              id: `prd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              content: req.aiGeneratedContent,
              createdAt: new Date().toISOString(),
              createdBy: 'User',
              changeSummary: '恢复之前的版本前保存',
            };
            updatedVersions = [...currentVersions, currentVersion];
          }

          return {
            requirements: state.requirements.map((r) =>
              r.id === requirementId
                ? {
                    ...r,
                    aiGeneratedContent: version.content,
                    prdVersions: updatedVersions,
                    updatedAt: new Date().toISOString(),
                  }
                : r
            ),
            currentRequirement:
              state.currentRequirement?.id === requirementId
                ? {
                    ...state.currentRequirement,
                    aiGeneratedContent: version.content,
                    prdVersions: updatedVersions,
                  }
                : state.currentRequirement,
          };
        });
      },
    }),
    {
      name: 'diaohua-requirements',
    }
  )
);
