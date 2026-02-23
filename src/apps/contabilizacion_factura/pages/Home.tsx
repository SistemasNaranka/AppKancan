import MainLayout from "../layouts/MainLayout";
import HomeComponent from "../components/home";
import { Box } from "lucide-react";

/**
 * Página principal del módulo de Contabilización de Facturas
 */
export default function Home() {
    return (
        <MainLayout>
            <HomeComponent />
        </MainLayout>
    );
}
