import { useQuery } from "@tanstack/react-query"
function Exportacion() {
    const { isLoading, error, data } = useQuery({
    queryKey: ["usuario"],
    queryFn: () => fetch("https://jsonplaceholder.typicode.com/users").then((res) => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutos
    })
        
    if (isLoading){
        return <h2>Sigue cargando</h2>
    }

    if (error){
        return <h2>Ocurrio el error </h2>
    }

    return (
        <div>
            <h2>Usuarios exportados</h2>
            <ul>
                {data.map((usuario: any) => (
                    <li key={usuario.id}>{usuario.name}</li>
                ))}
            </ul>
        </div>
    );
}
export default Exportacion