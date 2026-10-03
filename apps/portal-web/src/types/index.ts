import { LucideIcon } from 'lucide-react';

export type TierKey = 'BASIC' | 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';

export type AcquisitionMode = 'demo' | 'self_service';

export interface SelectedPlan {
  tierName: string;
  houses: number;
  estimatedPrice: string;
}

export interface TierInfo {
  key: TierKey;
  name: string;
  badge: string;
  priceMonthly: number;
  pricePerHouse: number;
  isCustom: boolean;
  summary: string;
  features: string[];
  icon: LucideIcon;
  color: string;
  accentBadge: string;
}

export interface PublicPlanCatalogItem {
  code: TierKey;
  name: string;
  description: string | null;
  monthlyPrice: number | string;
  minProperties: number;
  maxProperties: number;
  includesCustomDomain: boolean;
  customDomainAddonPrice: number | string;
  standardDomainPattern: string;
  isHighlighted: boolean;
  sortOrder: number;
}

export interface DemoFormData {
  name: string;
  email: string;
  phone: string;
  communityName: string;
  estimatedHouses: number;
  notes: string;
  honeypot: string;
}

export interface DemoSuccessData {
  id: string;
  name: string;
  community_name: string;
  estimated_houses: number;
  stage: string;
}

export interface SelfServiceFormData {
  communityName: string;
  slug: string;
  hasCustomDomain: boolean;
  maxProperties: number;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  cardNumber: string;
  cardExp: string;
  cardCvc: string;
  honeypot: string;
}

export interface SelfServiceSuccessData {
  slug: string;
  communityName: string;
  tier: string;
  maxProperties: number;
  accessUrl: string;
  portalUrl: string;
  subdomain?: string;
  hasCustomDomain: boolean;
  adminEmail: string;
}
