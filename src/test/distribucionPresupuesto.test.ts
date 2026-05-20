import { describe, it, expect } from "vitest";
import { distribuirPresupuesto } from "@/apps/informe_ventas/api/directus/read";

describe("distribuirPresupuesto", () => {
    it("debe distribuir correctamente un presupuesto de  1000", () => {
        const resultado = distribuirPresupuesto(1000);
        expect(resultado.presupuesto_coleccion).toBe(600);
        expect(resultado.presupuesto_basicos).toBe(200);
        expect(resultado.presupuesto_promocion).toBe(200);
    });

    it("debes retornar 0 en todo si el presupuesto es 0", () => {
        const resultado = distribuirPresupuesto(0);
        expect(resultado.presupuesto_coleccion).toBe(0);
        expect(resultado.presupuesto_basicos).toBe(0);
        expect(resultado.presupuesto_promocion).toBe(0);
    });

    it("debe redondear correctamente con 101", () => {
        const resultado = distribuirPresupuesto(101);
        expect(resultado.presupuesto_coleccion).toBe(61);
        expect(resultado.presupuesto_basicos).toBe(20);
        expect(resultado.presupuesto_promocion).toBe(20);
    });

    it("debe funcionar con números negativos", () => {
        const resultado = distribuirPresupuesto(-1000);
        expect(resultado.presupuesto_coleccion).toBe(-600);
        expect(resultado.presupuesto_basicos).toBe(-200)
        expect(resultado.presupuesto_promocion).toBe(-200);
    });

});
