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
  @IsIn(['URGENT', 'MAINTENANCE', 'ASSEMBLY', 'GENERAL'])
  category?: string = 'GENERAL';

  @IsString()
  @IsOptional()
  @IsIn(['HIGH', 'MEDIUM', 'LOW'])
  priority?: string = 'MEDIUM';

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
  @IsIn(['URGENT', 'MAINTENANCE', 'ASSEMBLY', 'GENERAL'])
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(['HIGH', 'MEDIUM', 'LOW'])
  priority?: string;

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
