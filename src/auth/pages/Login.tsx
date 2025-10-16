import LogoBlack from "@/assets/logo_black.png";
import Button from "@mui/material/Button";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import InputWithIcon from "@/auth/components/email"; 
import { useAuth } from "@/auth/hooks/useAuth";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema as schema } from "@/shared/utils/loginSchema";
import { useSnackbar } from "@/auth/hooks/useSnackbar";
import CustomSnackbar from "@/auth/components/SnackbarAlert";
import { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";

function Login() {
  const { login } = useAuth();
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      setLoading(true); // 🔹 activa el loader
      await login(data.email, data.password);
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      let message = "Error interno de Servidor. Inténtalo más tarde.";
      if (error?.response?.status === 401) {
        message = "Credenciales incorrectas.";
      } else if (error?.message?.includes("Network Error")) {
        message = "No se pudo conectar con el servidor.";
      }
      showSnackbar(message, "error");
    } finally {
      setLoading(false); // 🔹 desactiva el loader
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 sm:px-6">
      <div className="bg-white rounded-lg shadow-md shadow-neutral-700 w-full max-w-sm sm:max-w-md lg:max-w-lg p-6 sm:p-8 mx-2 sm:mx-0">
        {/* Logo */}
        <h2 className="mb-6 text-center">
          <img
            src={LogoBlack}
            alt="logo"
            className="mx-auto max-h-16 sm:max-h-20 md:max-h-24 object-contain"
          />
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center justify-center gap-6 w-full"
        >
          <div className="w-full flex flex-col gap-6">
            {/* Email */}
            <Controller
              name="email"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <InputWithIcon
                  id="email"
                  label="Correo"
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  Icon={MailOutlineIcon}
                  variant="standard"
                  placeholder="correo@ejemplo.com"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />

            {/* Password */}
            <Controller
              name="password"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <InputWithIcon
                  id="password"
                  label="Contraseña"
                  type="password"
                  value={field.value}
                  onChange={field.onChange}
                  Icon={LockOutlinedIcon}
                  variant="standard"
                  placeholder="*****"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}
            />
          </div>

          {/* Botón */}
          <div className="flex justify-center w-1/3 ">
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading} 
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Ingresar"}
            </Button>
          </div>
        </form>
      </div>
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}  
        onClose={closeSnackbar}
      />
    </div>
  );
}
export default Login;
