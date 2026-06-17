import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";

export const useCurvasPolicies = () => {
    const { user } = useAuth();
    const { area } = useApps();



const hasPolicy = (policyName: string): boolean => {
        return user?.policies?.includes(policyName) || false;
    };

const esAreaBodega = () => {
        const a = area?.toLowerCase();
        return a === 'bodega' || a === 'logistica';
    };

const esBodega = (): boolean => {
        return hasPolicy('read_curves_dispatches') || hasPolicy('read_curves_dispatches') || esAreaBodega();
    };

    const esAdmin = (): boolean => {
        const rolName = (user?.rol || (user as any)?.role?.name || (user as any)?.role || '').toLowerCase();
        
        const esRolPuro = rolName === 'admin' || rolName === 'administrador' || rolName === 'gerencia' || rolName === 'gerente';
        const tienePoliticaAdmin = hasPolicy('crud_curves_admin') || hasPolicy('crud_curves_admin');
        
        if (tienePoliticaAdmin) return true;

        const esSistemasAdmin = (rolName === 'sistemas' && !hasPolicy('read_curves_dispatches') && !hasPolicy('read_curves_dispatches'));



        return esRolPuro || esSistemasAdmin;
    };

const debeAterrizarEnDespacho = (): boolean => {
        const isAdmin = esAdmin();
        const restricted = !isAdmin;
        

        
        return restricted;
    };

    const esTiendaTransfers = (): boolean => {
        return hasPolicy('store_transfers');
    };

    return {
        hasPolicy,
        esBodega,
        esAdmin,
        esTiendaTransfers,
        debeAterrizarEnDespacho,
        userRole: esAdmin() ? 'admin' : esBodega() ? 'bodega' : esTiendaTransfers() ? 'tienda' : 'produccion'
    };
};
