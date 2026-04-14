import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";

/**
 * Hook personalizado para manejar las políticas de acceso del módulo de Curvas
 * Siguiendo el patrón establecido en el proyecto.
 */
export const useCurvasPolicies = () => {
    const { user } = useAuth();
    const { area } = useApps();



    /**
     * Verifica si el usuario tiene una política específica
     */
    const hasPolicy = (policyName: string): boolean => {
        return user?.policies?.includes(policyName) || false;
    };

    /**
     * Verifica si el usuario pertenece al área de bodega o logística
     */
    const esAreaBodega = () => {
        const a = area?.toLowerCase();
        return a === 'bodega' || a === 'logistica';
    };

    /**
     * Política: Usuario de Bodega
     * - Basado en política explícita o área coordinada
     */
    const esBodega = (): boolean => {
        return hasPolicy('CurvasBodegaDespacho') || hasPolicy('CurvasBodega') || esAreaBodega();
    };

    /**
     * Política: Usuario Administrador de Curvas
     */
    const esAdmin = (): boolean => {
        // Fallback for both 'rol' and 'role' property names
        const rolName = (user?.rol || (user as any)?.role?.name || (user as any)?.role || '').toLowerCase();
        
        // Exact matches or very specific substrings for legitimate admins
        const esRolPuro = rolName === 'admin' || rolName === 'administrador' || rolName === 'gerencia' || rolName === 'gerente';
        const tienePoliticaAdmin = hasPolicy('CurvasAdmin') || hasPolicy('CurvasBodegaAdmin');
        
        // If they have the specific admin policies, they are admins regardless of role
        if (tienePoliticaAdmin) return true;

        // If they don't have admin policies, we check the role with a fallback for 'sistemas'
        // 'sistemas' is admin ONLY if they don't have the restricted 'CurvasBodegaDespacho' or 'CurvasBodega' policy
        const esSistemasAdmin = (rolName === 'sistemas' && !hasPolicy('CurvasBodegaDespacho') && !hasPolicy('CurvasBodega'));



        return esRolPuro || esSistemasAdmin;
    };

    /**
     * Determina si el usuario debe ser redirigido directamente al Sistema de Despacho
     */
    const debeAterrizarEnDespacho = (): boolean => {
        const isAdmin = esAdmin();
        const restricted = !isAdmin;
        

        
        return restricted;
    };

    return {
        hasPolicy,
        esBodega,
        esAdmin,
        debeAterrizarEnDespacho,
        userRole: esAdmin() ? 'admin' : esBodega() ? 'bodega' : 'produccion'
    };
};
