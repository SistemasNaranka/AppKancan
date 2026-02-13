import MainLayout from "../layouts/MainLayout";
import WelcomeMessage from "../components/WelcomeMessage";

/**
 * Página principal del módulo de Contabilización de Facturas
 */
export default function Home() {
    return (
        <MainLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <WelcomeMessage />
            </div>
        </MainLayout>
    );
}
