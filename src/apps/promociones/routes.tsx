import App from './src/App';

import { RouteObject } from "react-router-dom";

const routes : RouteObject[] = [
  {
    path: "/promociones", // <- se monta como /reportes
    element: <App />,
  },
];

export default routes;