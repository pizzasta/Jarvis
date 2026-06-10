# Jarvis# Jarvis - AI City Architecture

## Project Overview
Jarvis is a scalable AI city architecture designed for modularity and performance.

## Core Architecture

### Modular Component Structure
The project is organized into dedicated directories to ensure a clean separation of concerns:
- **/components**: Reusable UI building blocks for the city interface.
- **/store**: Centralized state management (powered by Zustand or Redux) for managing city and agent states.
- **/layouts**: Structural components like the Building Layout to organize the city grid.
- **/services**: Houses complex logic for agent behaviors and city routing.
- **/types**: Core TypeScript definitions, including the base Building interface.

### Central State Management
State is handled centrally to provide a single source of truth for the entire city simulation, ensuring agents and buildings stay synchronized.

### Mobile Responsive Design
The architecture is built with a mobile-first approach, ensuring that the AI city dashboard is fully accessible and interactive on all screen sizes.
