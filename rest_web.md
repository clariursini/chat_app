# REST

Es una forma de construir aplicaciones web usando HTTP entre cliente y servidor.
Los datos se identifican con URLs y las operaciones siguen los métodos CRUD:
Create (POST), Read (GET), Update (PUT) y Delete (DELETE).

# WEB SOCKETS

Es un protocolo que permite la comunicación en tiempo real mediante una única
conexión entre cliente y servidor. Esta se mantiene abierta permitiendo que
la transferencia sea veloz sin la necesidad de solicitudes múltiples.


# PROS y CONS

## WEB SOCKETS
### PROS
- Comunicación instantánea
- Baja latencia
- Menor carga en el servidor

### CONS
- Complejo de implementar
- Consume más recursos
- Difícil de escalar

## REST
### PROS
- Sencillo
- Escalable
- Independiente del cliente

### CONS
- No es tiempo real, solo a demanda
- Mayor latencia, requiere enviar solicitudes para cada acción
