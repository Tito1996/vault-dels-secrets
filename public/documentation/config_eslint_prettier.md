# Configuración de ESLint y Prettier en el proyecto Angular

Este documento describe cómo está configurado el proyecto para usar **ESLint** y **Prettier** de forma conjunta en **Angular** con **VS Code**, evitando conflictos entre ambas herramientas y asegurando un flujo de trabajo consistente.

---

## Objetivo de la configuración

- Usar **ESLint** como herramienta de *linting* para TypeScript y templates Angular.
- Usar **Prettier** exclusivamente para el formateo de código.
- Evitar reglas duplicadas o contradictorias entre ESLint y Prettier.
- Permitir correcciones automáticas y formateo al guardar en VS Code.

---

## 1. ESLint para Angular (angular-eslint)

El proyecto utiliza **angular-eslint**, que es la solución oficial para integrar ESLint con Angular.

Instalación realizada:

```bash
ng add @angular-eslint/schematics
```

Esto proporciona:

- Linting de TypeScript (`@angular-eslint`)
- Linting de templates HTML (`@angular-eslint/template`)
- Integración con `ng lint`

Verificación:

```bash
ng lint
```

---

## 2. Prettier e integración con ESLint

Dependencias de desarrollo instaladas:

```bash
npm i -D prettier eslint-config-prettier
```

### Propósito de cada paquete

- **prettier**: motor de formateo de código.
- **eslint-config-prettier**: desactiva reglas de ESLint que entran en conflicto con Prettier.

> Nota: No se utiliza `eslint-plugin-prettier` por defecto. Prettier se ejecuta como herramienta independiente de formateo.

---

## 3. Configuración de Prettier

### Archivo `.prettierrc.json`

```json
{
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all",
  "semi": true
}
```

### Archivo `.prettierignore`

```
dist
coverage
node_modules
.angular
```

---

## 4. Integración ESLint + Prettier

El proyecto utiliza la **Flat Config** de ESLint (`eslint.config.js` o `eslint.config.mjs`), generada por `angular-eslint`.

La integración se basa en:

- Mantener todas las reglas de linting en ESLint.
- Delegar el formateo exclusivamente a Prettier.
- Aplicar `eslint-config-prettier` al final de la configuración para desactivar reglas de estilo conflictivas.

Este enfoque evita que ESLint y Prettier “se peleen”.

---

## 5. Scripts de npm

En el `package.json` se definen los siguientes scripts:

```json
{
  "scripts": {
    "lint": "ng lint",
    "lint:fix": "ng lint --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```

Uso recomendado:

- `npm run lint`: detectar problemas de lint.
- `npm run lint:fix`: corregir problemas automáticamente cuando sea posible.
- `npm run format`: aplicar formato Prettier a todo el proyecto.
- `npm run format:check`: validar formato sin modificar archivos (útil en CI).

---

## 6. Configuración de VS Code

Extensiones requeridas:

- ESLint (Microsoft)
- Prettier - Code formatter

### Archivo `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  "eslint.validate": ["typescript", "html"]
}
```

### Comportamiento resultante

- Al guardar un archivo:
  - Prettier formatea el código.
  - ESLint aplica correcciones automáticas disponibles.
- Los templates Angular (`.html`) también son validados por ESLint.

---

## 7. Angular Material

El proyecto ya incluye **Angular Material**.

Consideraciones:

- Prettier gestiona correctamente SCSS en la mayoría de los casos.
- Si en el futuro se requieren reglas de estilo específicas para SCSS, se puede evaluar añadir **Stylelint** (opcional).

---

## Conclusión

Esta configuración separa claramente responsabilidades:

- **ESLint**: calidad y consistencia del código.
- **Prettier**: formateo automático.

El resultado es un entorno estable, predecible y alineado con las prácticas recomendadas actuales para proyectos