export type Checklist = {
  id: string;
  name: string;
  game_key: string;
  revision: number;
  created_at: string;
  updated_at: string;
};

export type ChecklistPokemon = {
  checklist_id: string;
  pokemon_api_id: number;
  is_captured: boolean;
  updated_at: string;
};
