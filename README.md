# Vault dels secrets

Gestor de contraseñas local, cifrado y sin servidor, construido con Angular 20.

---

## Tecnologías y librerías

### Angular 20

Framework principal de la aplicación. Se utiliza en su modo **standalone** (sin `NgModules`), con **Signals** para la gestión reactiva del estado y directivas de control de flujo (`@if`, `@for`) de la nueva sintaxis de plantillas.

| Paquete Angular                 | Uso                                                       |
| ------------------------------- | --------------------------------------------------------- |
| `@angular/core` ^20             | Motor del framework: componentes, signals y ciclo de vida |
| `@angular/common` ^20           | Directivas y pipes comunes                                |
| `@angular/forms` ^20            | Enlace bidireccional de formularios con `ngModel`         |
| `@angular/router` ^20           | Enrutado de la SPA                                        |
| `@angular/platform-browser` ^20 | Bootstrapping en el navegador                             |

### Dependencias de producción

| Paquete          | Versión | Función                                                                                                                                                                 |
| ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `argon2-browser` | ^1.18.0 | Derivación de claves con el algoritmo **Argon2id** directamente en el navegador (sin servidor). Convierte la contraseña maestra en una clave criptográfica de 256 bits. |
| `rxjs`           | ~7.8.0  | Librería de programación reactiva; usada internamente por Angular.                                                                                                      |
| `zone.js`        | ~0.15.0 | Mecanismo de detección de cambios de Angular.                                                                                                                           |
| `tslib`          | ^2.3.0  | Ayudantes de compilación de TypeScript, reduce el tamaño del bundle.                                                                                                    |

### Dependencias de desarrollo

| Paquete                     | Versión     | Función                                                   |
| --------------------------- | ----------- | --------------------------------------------------------- |
| `typescript`                | ~5.8.2      | Lenguaje base del proyecto.                               |
| `vitest`                    | ^3.2.4      | Framework de tests unitarios rápido, compatible con Vite. |
| `@vitest/coverage-v8`       | ^3.2.4      | Cobertura de código con el motor V8.                      |
| `prettier`                  | ^3.8.1      | Formateador de código automático.                         |
| `eslint` + `angular-eslint` | ^9 / 21.0.1 | Análisis estático y reglas específicas de Angular.        |
| `jsdom`                     | ^29.0.0     | Simulación de DOM para los tests en entorno Node.         |

---

## Descripción de la aplicación

**Vault dels secrets** es un gestor de contraseñas que funciona íntegramente en el navegador. No existe ningún servidor, base de datos ni cuenta de usuario: todo el procesamiento ocurre en el dispositivo del usuario.

### ¿Qué hace?

- Permite **crear, abrir, editar y guardar** un archivo `.json` cifrado que contiene credenciales (nombre, usuario, contraseña, categoría, URL y notas).
- Ofrece **búsqueda** por cualquier campo y **filtrado** por categoría.
- Muestra u oculta las contraseñas almacenadas bajo demanda.
- **Bloquea automáticamente** el vault tras 3 minutos de inactividad del usuario.
- Permite **exportar** el vault como archivo cifrado (`Guardar como…`) o sobrescribir el archivo original si el navegador admite la File System Access API.

### ¿Cómo funciona la seguridad?

1. La contraseña maestra nunca se almacena. Se usa una sola vez para derivar la clave.
2. La derivación de clave usa **Argon2id** (resistente a ataques de fuerza bruta por hardware).
3. El vault se cifra con **AES-256-GCM** (cifrado autenticado, detecta cualquier manipulación del archivo).
4. Al bloquear el vault, los datos en memoria se sobreescriben con cadenas vacías antes de ser eliminados.

### ¿Cookies o almacenamiento persistente?

**No.** La aplicación **no utiliza cookies, `localStorage`, `sessionStorage` ni ningún otro mecanismo de persistencia en el navegador**. Los datos descifrados existen únicamente en memoria mientras el vault está abierto. Al cerrar la pestaña o bloquear el vault, desaparecen por completo.

---

## Desarrollo local

```bash
npm install
npm start          # inicia en http://localhost:4200
```

### Compilar para producción

```bash
npm run build      # artefactos en dist/
```

### Tests

```bash
npm test           # vitest run (con cobertura)
npm run test:watch # vitest en modo observador
```

### Lint y formato

```bash
npm run lint
npm run lint:fix
npm run format
```

---

## Versiones y cambios

### v1.0.2 — actual

- Formulario de crear/editar entrda oculto por defecto; se despliega y centra en pantalla al pulsar **Nueva** o **Editar**.
- Sección de apertura de archivo adaptativa: muestra solo el botón **Bloquear** cuando el vault está abierto, y los controles de carga cuando está cerrado.
- Botón flotante de ayuda con tutorial rápido y enlaces a LinkedIn y GitHub del autor.

### v1.0.0

- Lanzamiento inicial de la aplicación.
- Crear, abrir, cifrar y exportar vaults con Argon2id + AES-256-GCM.
- CRUD completo de entradas con búsqueda y filtro por categoría.
- Bloqueo automático por inactividad (3 min).
- Indicador de fortaleza de contraseña al crear un vault nuevo.
