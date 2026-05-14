// src/apps/contactos/hooks/useContactos.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Contactos, CreateContactoInput } from '../types/contact';
import { getContactos } from '../api/directus/read';
import { createContacto, updateContacto, deleteContacto } from '../api/directus/create';

const COLORES = [
  '#004a99', '#e63946', '#2a9d8f', '#e9c46a',
  '#f4a261', '#264653', '#6a4c93', '#1982c4',
];

const procesarContacto = (c: Contactos, index: number): Contactos => ({
  ...c,
  iniciales: c.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase(),
  color: COLORES[index % COLORES.length],
});

export const useContactos = () => {
  const [contactos, setContactos] = useState<Contactos[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Cargar ────────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await getContactos();
      setContactos(data.map(procesarContacto));
    } catch (err: any) {
      setError(err.message || 'Error al cargar contactos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Crear ─────────────────────────────────────────────────────────────────
  const crear = async (data: CreateContactoInput): Promise<boolean> => {
    const id = await createContacto(data);
    if (id) { await cargar(); return true; }
    return false;
  };

  // ── Actualizar ────────────────────────────────────────────────────────────
  const actualizar = async (id: number, data: Partial<CreateContactoInput>): Promise<boolean> => {
    const ok = await updateContacto(id, data);
    if (ok) await cargar();
    return ok;
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const eliminar = async (id: number): Promise<boolean> => {
    const ok = await deleteContacto(id);
    if (ok) setContactos((prev) => prev.filter((c) => c.id !== id));
    return ok;
  };

  // ── Ordenar ───────────────────────────────────────────────────────────────
  const handleSort = (criterio: 'asc' | 'desc' | 'area') => {
    setContactos((prev) => {
      const temp = [...prev];
      if (criterio === 'asc')  temp.sort((a, b) => a.full_name.localeCompare(b.full_name));
      if (criterio === 'desc') temp.sort((a, b) => b.full_name.localeCompare(a.full_name));
      if (criterio === 'area') temp.sort((a, b) => a.department.localeCompare(b.department));
      return temp;
    });
  };

  // ── Filtrar ───────────────────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase().trim();
    if (!t) return contactos;
    return contactos.filter(
      (c) =>
        c.full_name.toLowerCase().includes(t) ||
        c.department.toLowerCase().includes(t) ||
        c.email.toLowerCase().includes(t),
    );
  }, [contactos, busqueda]);

  return {
    contactos: filtrados,
    busqueda,
    setBusqueda,
    total: contactos.length,
    handleSort,
    cargando,
    error,
    crear,
    actualizar,
    eliminar,
    recargar: cargar,
  };
};