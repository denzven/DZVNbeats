export interface Beat {
  id: string;
  title: string;
  filename: string;
  url: string;
  coverArt?: string;
  bpm: number;
  key?: string;
  tags: string[];
  price: number;
  duration?: string;
  status?: "Available" | "Sold";
  beatType?: "Free" | "Standard" | "Exclusive";
  isTagged?: boolean;
}

export type LicensingTierName =
  "Free (Tagged)" | "Basic Lease" | "Premium Lease" | "Exclusive Contract";

export interface LicensingTier {
  id: string;
  name: LicensingTierName;
  price: number;
  format: string;
  streamLimit: string;
  distributionLimit: string;
  radioRights: boolean;
  stemFiles: boolean;
  popular?: boolean;
  description: string;
}

export interface InquirePayload {
  beat: Beat;
  tier: LicensingTierName;
}
