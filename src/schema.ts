export interface User {
  id: number;
  username: string;
}

export interface Actor {
  id: number;
  user_id: number | null;
  uri: string;
  handle: string;
  name: string | null;
  inbox_url: string;
  shared_inbox_url: string | null;
  url: string | null;
  created: string;
}
