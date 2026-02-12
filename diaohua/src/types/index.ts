// Requirement types
export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  status: RequirementStatus;
  priority: Priority;
  creatorId: string;
  assigneeId?: string;
  tags: string[];
  screenshots: Screenshot[];
  userDescription: string;
  aiGeneratedContent?: AIGeneratedContent;
  mockupDesigns?: MockupDesign[];
  selectedMockupId?: string;
  prdVersions?: PRDVersion[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export type RequirementStatus = 
  | 'draft' 
  | 'annotating' 
  | 'ai_generating' 
  | 'mockup_review' 
  | 'designing' 
  | 'completed' 
  | 'archived';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Screenshot {
  id: string;
  url: string; // 截图时网页URL
  pageUrl: string; // 截图时网页URL（冗余备份）
  pageTitle?: string; // 截图时网页标题
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  annotations: Annotation[];
  description: string;
  order: number;
  createdAt: string;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  color?: string;
  strokeWidth?: number;
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: { x: number; y: number }[];
  };
  text?: string;
}

export type AnnotationType = 'rectangle' | 'circle' | 'arrow' | 'draw' | 'text';

export interface AIGeneratedContent {
  prdMarkdown: string;
  designSuggestions: DesignSuggestion;
  generatedPrompt: string;
  generatedAt: string;
}

export interface DesignSuggestion {
  layout: {
    style: string;
    description: string;
  };
  components: ComponentSuggestion[];
  styleGuide: {
    colors: string[];
    typography: string;
  };
  interactions: string[];
}

export interface ComponentSuggestion {
  name: string;
  type: string;
  description: string;
  props?: string[];
}

export interface MockupDesign {
  id: string;
  generationBatch: number;
  variant: 'A' | 'B';
  imageUrl: string;
  prompt: string;
  style: string;
  params: {
    aspectRatio: string;
    seed?: number;
  };
  selected: boolean;
  createdAt: string;
}

// PRD Version History
export interface PRDVersion {
  id: string;
  content?: AIGeneratedContent;
  // 展开的属性（兼容旧代码）
  prdMarkdown?: string;
  generatedAt?: string;
  generatedPrompt?: string;
  designSuggestions?: DesignSuggestion;
  createdAt: string;
  createdBy: string;
  changeSummary?: string;
}

// Comment types
export interface Comment {
  id: string;
  requirementId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  replyTo?: string;
  replyToAuthor?: string;
  createdAt: string;
  updatedAt?: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
}

// Settings types
export interface AppConfig {
  geminiApiKey: string;
  oss: OSSConfig;
}

export interface OSSConfig {
  provider: 'qiniu' | 'aliyun' | 'aws';
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  domain?: string;
}

// Generation types
export interface GenerationRequest {
  requirementId: string;
  screenshots: Screenshot[];
  userDescription: string;
  aspectRatio?: string;
}

export interface GeminiImageRequest {
  model: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  numberOfImages: number;
  seed?: number;
}

export interface GeminiImageResponse {
  images: {
    bytesBase64Encoded: string;
    mimeType: string;
  }[];
}

// Notification types
export interface Notification {
  id: string;
  type: 'comment_reply' | 'requirement_update' | 'mockup_generated';
  title: string;
  content: string;
  requirementId?: string;
  requirementTitle?: string;
  commentId?: string;
  read: boolean;
  createdAt: string;
}
