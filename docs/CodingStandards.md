# 📏 Coding Standards de Risto Platform

> Estándares de código para todos los lenguajes del proyecto.

---

## Filosofía

1. **Legibilidad > Performance** (a menos que se demuestre lo contrario)
2. **Código es deuda, documentación es activo**
3. **Simplicidad > Ingeniería excesiva**
4. **DRY** (Don't Repeat Yourself) pero **WET** (Write Everything Twice) antes de abstraer

---

## Firmware (C++)

### Estilo
```cpp
// ✅ Correcto
class NetworkManager {
public:
    bool connect(const String& ssid, const String& password);
    bool isConnected();
    
private:
    String _ssid;
    WiFiClient _client;
};

// ❌ Incorrecto
class network_manager {
public:
    bool ConnectToWiFi(const String& ssid, const String& password);
    bool connected = false;
};
```

### Reglas
- `#pragma once` en todos los headers
- Métodos de hasta 30 líneas máximo
- Una clase por archivo
- Preferir composición sobre herencia
- Usar `const` siempre que sea posible

---

## Cloud (Node.js)

### Estilo
```javascript
// ✅ Correcto
async function handleTicketRequest(event) {
    const { deviceId } = event;
    const nextNumber = await ticketService.getNextNumber(deviceId);
    return { ticketNumber: nextNumber };
}

// ❌ Incorrecto
function handle(e) {
    let x = e.deviceId;
    // ... 50 líneas después
    return { n: x };
}
```

### Reglas
- Async/await sobre callbacks y promesas planas
- Nombres descriptivos, no abreviaturas
- Funciones de hasta 20 líneas
- Validación con JSON Schema
- Tests con Jest

---

## SaaS (React/Next.js)

### Estilo
```tsx
// ✅ Correcto
function TicketButton() {
    const [isLoading, setIsLoading] = useState(false);
    
    const handleClick = async () => {
        setIsLoading(true);
        await requestTicket();
        setIsLoading(false);
    };
    
    return (
        <button onClick={handleClick} disabled={isLoading}>
            {isLoading ? 'Imprimiendo...' : 'TOMAR FICHA'}
        </button>
    );
}
```

### Reglas
- Componentes funcionales con hooks
- TypeScript obligatorio
- Estilos con Tailwind CSS o CSS Modules
- Estado global solo cuando es necesario (Context/Zustand)

---

## Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar botón físico arcade
fix: corregir timeout de impresora Bluetooth
docs: actualizar ADR-0002 con formato de eventos
refactor: extraer NetworkManager a módulo separado
test: agregar tests para TicketEngine
chore: configurar CI/CD
```

---

## Pull Requests

- Título descriptivo: `feat: agregar soporte OTA`
- Descripción con contexto
- Referencia al ticket: `Closes RP-0009`
- Checklist de verificación
- Máximo 400 líneas por PR
