export interface Building {
  id: string;
  icon: string;
  title: string;
  description: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  actions: string[];
  memory: Record<string, any>;
}
