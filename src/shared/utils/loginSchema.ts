import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("Correo no válido")
    .required("El correo es obligatorio"),
  password: yup
    .string()
    .min(3, "La contraseña debe tener mínimo 3 caracteres")
    .required("La contraseña es obligatoria"),
});
