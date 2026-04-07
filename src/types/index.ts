export type UserRole = 'influencer' | 'brand';

export type PlanTier = 'free' | 'starter' | 'pro';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  plan: PlanTier;
  verified: boolean;
  createdAt: string;
}

export interface InfluencerProfile {
  id: string;
  userId: string;
  name: string;
  handle: string;
  avatar?: string;
  bio: string;
  niche: string[];
  city: string;
  igFollowers?: number;
  ttFollowers?: number;
  igEr?: number;
  priceRange: [number, number];
  portfolio: string[];
  rating: number;
  reviewCount: number;
  plan: PlanTier;
  verified: boolean;
  available: boolean;
}

export interface BrandProfile {
  id: string;
  userId: string;
  name: string;
  logo?: string;
  bio: string;
  sector: string;
  city: string;
  website?: string;
  rating: number;
  reviewCount: number;
  plan: PlanTier;
  verified: boolean;
  activeCollabs: number;
}

export interface Collaboration {
  id: string;
  brandId: string;
  brandName: string;
  brandLogo?: string;
  title: string;
  description: string;
  niche: string[];
  city?: string;
  remote: boolean;
  compensation: 'paid' | 'barter' | 'both';
  budget?: number;
  deliverables: string[];
  deadline?: string;
  applicants: number;
  featured: boolean;
  boosted: boolean;
  boostUntil?: string;
  createdAt: string;
  status: 'open' | 'closed' | 'draft';
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Thread {
  id: string;
  participants: string[];
  collaborationId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unread: number;
}
