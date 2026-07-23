import ConvertidorPdfPanel from "./pages/ConvertidorPdfPanel";
import { RouteObject } from "react-router-dom";

const routes: RouteObject[] = [
  {
    path: "/convertidor_pdf",
    element: <ConvertidorPdfPanel />,
  },
];

export default routes;
