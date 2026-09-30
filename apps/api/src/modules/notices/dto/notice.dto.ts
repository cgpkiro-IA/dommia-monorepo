import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  @IsIn(['URGENT', 'MAINTENANCE', 'ASSEMBLY', 'GENERAL', 'GUARD_CONSIGN', 'SECURITY'])
  category?: string = 'GENERAL';

  @IsString()
  @IsOptional()
  @IsIn(['HIGH', 'MEDIUM', 'LOW', 'URGENT'])
  priority?: string = 'MEDIUM';

  @IsString()
  @IsOptional()
  @IsIn(['ALL', 'RESIDENTS', 'GUARDS'])
  targetAudience?: string = 'ALL';

  @IsString()
  @IsOptional()
  target_audience?: string;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  expires_at?: string;

  @IsString()
  @IsOptional()
  authorName?: string;

  @IsString()
  @IsOptional()
  author_name?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  is_pinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;
}

export class UpdateNoticeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  @IsIn(['URGENT', 'MAINTENANCE', 'ASSEMBLY', 'GENERAL', 'GUARD_CONSIGN', 'SECURITY'])
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(['HIGH', 'MEDIUM', 'LOW', 'URGENT'])
  priority?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ALL', 'RESIDENTS', 'GUARDS'])
  targetAudience?: string;

  @IsString()
  @IsOptional()
  target_audience?: string;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  expires_at?: string;

  @IsString()
  @IsOptional()
  authorName?: string;

  @IsString()
  @IsOptional()
  author_name?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  is_pinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;
}

