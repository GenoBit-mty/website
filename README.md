# GenoBit Website

Official website for the GenoBit bioinformatics student group.

## Features
- **Modern UI**: Built with React, TailwindCSS, and shadcn/ui.
- **Backend**: Powered by Convex.
- **Components**:
  - Team Directory ("Conoce al equipo")
  - Past Administrations ("Gestiones pasadas")
  - Events Calendar ("Eventos")
  - Research Repository ("Investigaciones")

## Prerequisites
- [Bun](https://bun.sh/) (Runtime)

## Getting Started

1.  **Install Dependencies**
    ```bash
    bun install
    ```

2.  **Setup Convex**
    If this is your first time:
    ```bash
    bun convex dev
    ```
    This will prompt you to log in to Convex and configure the project.

3.  **Run Development Server**
    ```bash
    bun run dev
    ```
    The site will be available at `http://localhost:3000`.

## Project Structure
- `convex/`: Backend functions and schema.
- `src/components/`: Reusable UI components.
- `src/routes/`: Pages and routing configuration.
- `src/styles.css`: Global styles and theme variables.

## Deployment
Build the project for production:
```bash
bun run build
```
Preview the build:
```bash
bun run preview
```
