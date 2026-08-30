export type Demo = {
  id: string | number;
  artist_id: string;
  name: string;
  file_url: string;
  duration_secs: number | null;
  file_size_bytes: number | null;
  sort_order: number | null;
};

export type ArtistSummary = {
  id: string;
  name: string;
  photo_url: string;
  brand_color: string;
  categories: string[];
  gender: string;
  demo_count: number;
};

export type ArtistDetail = ArtistSummary & {
  bio: string;
  demos: Demo[];
};

export type EnquiryInput = {
  artist_id: string;
  sender_name: string;
  sender_email: string;
  sender_company: string;
  project_type: string;
  message: string;
};
