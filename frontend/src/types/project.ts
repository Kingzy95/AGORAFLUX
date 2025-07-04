export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  owner_id: number;
  owner?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  tags: string;
  objectives?: string;
  methodology?: string;
  expected_outcomes?: string;
  allow_comments: boolean;
  allow_contributions: boolean;
  moderation_enabled: boolean;
  created_at: string;
  updated_at?: string;
  published_at?: string;
  completed_at?: string;
  archived_at?: string;
  view_count: number;
  contributor_count: number;
  likes_count: number;
  comments_count: number;
  datasets_count: number;
}

export interface Dataset {
  id: number;
  name: string;
  slug: string;
  description: string;
  source_url?: string;
  type: string;
  file_path?: string;
  original_filename?: string;
  file_size: number;
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'ERROR';
  quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  project_id: number;
  uploaded_by_id: number;
  uploaded_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  rows_count?: number;
  columns_count?: number;
  missing_values_count?: number;
  duplicate_rows_count?: number;
  completeness_score?: number;
  consistency_score?: number;
  validity_score?: number;
  overall_quality_score?: number;
  column_metadata?: string;
  created_at: string;
  updated_at?: string;
  processed_at?: string;
  last_accessed?: string;
  processing_log?: string;
  error_log?: string;
  is_exportable: boolean;
  export_formats: string;
}

export interface Comment {
  id: number;
  content: string;
  type: 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ANSWER';
  status: 'ACTIVE' | 'PENDING' | 'HIDDEN' | 'DELETED';
  author_id: number;
  author?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  project_id: number;
  parent_id?: number;
  thread_depth: number;
  likes_count: number;
  replies_count: number;
  flags_count: number;
  is_edited: boolean;
  is_pinned: boolean;
  is_highlighted: boolean;
  created_at: string;
  updated_at?: string;
  edited_at?: string;
  replies?: Comment[];
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  tags: string;
  objectives?: string;
  methodology?: string;
  expected_outcomes?: string;
  allow_comments: boolean;
  allow_contributions: boolean;
  moderation_enabled: boolean;
  visibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}

export interface CreateCommentRequest {
  content: string;
  type: 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ANSWER';
  parent_id?: number;
} 