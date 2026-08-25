# LMS Frontend

React client for the LMS platform, scaffolded with Vite.

```text
src/
  api/          Axios client and API integrations
  components/   reusable presentation components
  features/     auth, courses, enrollments, assessments, and role modules
  hooks/        shared React hooks
  layouts/      page-level layouts
  store/        client state management
  utils/        reusable frontend helpers
  App.jsx       application routes and shell
  main.jsx      browser entry point
```

Copy `.env.example` to `.env` to configure the backend API URL.# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
