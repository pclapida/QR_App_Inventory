# 📘 Documentación Integral del Sistema de Inventario y Control de Activos IT — COFICAB

> **Versión del Sistema:** 2.5 (Producción)  
> **Empresa:** COFICAB México  
> **Entorno:** Multi-Planta (Planta 1, Planta 2, Planta 3, Planta UPCAST)  
> **Tecnologías:** React + Vite, Node.js + Express, Prisma ORM, SQLite / PostgreSQL, Tailwind & Glassmorphism Design, Cloudflare Tunnel.

---

## 📑 Tabla de Contenido
1. [Arquitectura General y Multi-Planta](#1-arquitectura-general-y-multi-planta)
2. [Matriz de Roles y Permisos (RBAC)](#2-matriz-de-roles-y-permisos-rbac)
3. [Módulo de Inventario y Máquina de Estados (6 Pestañas)](#3-módulo-de-inventario-y-máquina-de-estados-6-pestañas)
4. [Sistema de Checklists Técnicos y Plantillas](#4-sistema-de-checklists-técnicos-y-plantillas)
5. [Sistema de Responsivas Digitales y Firmas](#5-sistema-de-responsivas-digitales-y-firmas)
6. [Escáner Móvil y Pistola Física con Acciones Contextuales](#6-escáner-móvil-y-pistola-física-con-acciones-contextuales)
7. [Módulo de Préstamos Temporales de IT](#7-módulo-de-préstamos-temporales-de-it)
8. [Módulo de Mantenimiento Preventivo y Matriz de Tareas](#8-módulo-de-mantenimiento-preventivo-y-matriz-de-tareas)
9. [Módulo de Órdenes de Compra y Requisiciones](#9-módulo-de-órdenes-de-compra-y-requisiciones)
10. [Impresión de Etiquetas Térmicas y Códigos QR](#10-impresión-de-etiquetas-térmicas-y-códigos-qr)
11. [Dashboard para Pantallas TV en Tiempo Real](#11-dashboard-para-pantallas-tv-en-tiempo-real)
12. [Administración de Usuarios y Seguridad](#12-administración-de-usuarios-y-seguridad)
13. [Auditoría, Trazabilidad y Línea de Tiempo](#13-auditoría-trazabilidad-y-línea-de-tiempo)

---

## 1. Arquitectura General y Multi-Planta

El sistema gestiona de forma centralizada todos los activos de Tecnologías de Información distribuidos en:
- **Planta 1**
- **Planta 2 (Principal)**
- **Planta 3**
- **Planta UPCAST**

### Características Globales:
- **Trazabilidad de Planta de Origen:** Cada activo conserva el registro de su planta de origen (`originPlant`) y su planta física actual (`plant`).
- **Filtro Global por Planta:** Los administradores pueden alternar en cualquier momento entre ver el inventario global de todas las plantas o filtrar una planta específica.
- **Acceso Remoto Seguro:** Conectividad mediante túnel Cloudflare seguro (`HTTPS`) compatible con PCs de escritorio, laptops, tablets y smartphones corporativos.

---

## 2. Matriz de Roles y Permisos (RBAC)

El sistema cuenta con un control de acceso granular basado en 5 niveles de rol:

| Rol | Alcance | Permisos Principales |
|---|---|---|
| **👑 SUPERADMIN** | Global (Todas las Plantas) | Control total absoluto: Alta/baja de activos, edición, eliminación permanente de DB, traslados entre cualquier planta, asignaciones, gestión de usuarios, creación de plantillas globales. |
| **🏢 ADMIN_PLANTA / ADMIN** | Planta Asignada / Local | Control total en su planta: Alta de equipos, asignación con responsiva/checklist, devoluciones, traslados hacia otras plantas, reportes de bajas/scrap, gestión de operadores locales. |
| **🛠️ OPERATOR (Técnico IT)** | Operativo IT | Operaciones diarias de campo: Escaneo QR, asignación de equipos, devoluciones al almacén, llenado y firma de checklists, registro de mantenimientos, reporte de fallas y préstamos. No puede eliminar activos ni alterar roles de usuario. |
| **👁️ AUDITOR** | Consulta / Auditoría | Acceso de solo lectura a inventarios, historiales, responsivas firmadas, métricas y exportación de reportes. Sin permisos de modificación. |
| **👤 USER** | Consulta Básica | Visualización informativa de activos. |

---

## 3. Módulo de Inventario y Máquina de Estados (6 Pestañas)

El inventario organiza los activos en 6 pestañas operativas con reglas estrictas de transición de estados:

```
                      ┌──────────────────────────────────────────────┐
                      │  2. DISPONIBLE (Almacén Taller IT)          │
                      │  - isITInternal = true, assignedTo = null   │
                      └───────┬───────────────────────────────┬──────┘
                              │                               │
                      [Asignar Equipo]                  [Reportar Falla]
                              │                               │
                              ▼                               ▼
        ┌─────────────────────────────┐        ┌─────────────────────────────┐
        │ 1. ASIGNADO                 │        │ 6. CON FALLAS / DAÑADO      │
        │ - isITInternal = false      │        │ - faults != null            │
        │ - assignedTo = colaborador  │        │ - en espera de reparación   │
        └─────────────┬───────────────┘        └──────────────┬──────────────┘
                      │                                       │
                [Devolver]                               [Reparar]
                      │                                       │
                      └───────────────► ◄─────────────────────┘
                                       │
                       [Baja / Desincorporación]
                                       │
                                       ▼
                        ┌─────────────────────────────┐
                        │ 4. BAJAS & SCRAP            │
                        │ - status = DECOMMISSIONED   │
                        │ - motivo de desecho/E-Waste │
                        └──────────────┬──────────────┘
                                       │
                           [Reactivar por Admin]
                                       │
                                       ▼
                             (Regresa a Disponible)
```

### Detalle de las 6 Pestañas:

1. **`1. Inventario Asignado`**:
   - Muestra todos los equipos actualmente en posesión de colaboradores, líneas de producción o áreas administrativas con responsiva digital formal.
   - Columnas: SKU, Nombre, Modelo/Serie, Colaborador Asignado, Área, Planta, Acciones.
   - **Acción Devolver:** Retira el equipo del usuario, anula checklists anteriores y lo regresa al taller IT como *Disponible*.

2. **`2. Inventario Disponible (Almacén IT)`**:
   - Stock físico en poder del equipo de IT listo para ser entregado o prestado.
   - Control de stock actual vs. stock mínimo con alertas visuales de bajo inventario.
   - Botón directo de **`+ Registrar Activo en IT`**.
   - **Acción Asignar:** Dispara el flujo de checklist (si aplica) y responsiva digital.

3. **`3. Préstamos Temporales de IT`**:
   - Equipos prestados por horas o días (laptops de guardia, proyectores, adaptadores).
   - Muestra solicitante, gafete, fecha de préstamo, fecha estimada de devolución y estatus dinámico (**ACTIVO**, **DEVUELTO**, **VENCIDO / OVERDUE**).

4. **`4. Bajas de Activos & Scrap`**:
   - Registro histórico de activos desincorporados por obsolescencia, daño irreparable, fin de vida útil o disposición de residuo electrónico (*E-Waste*).
   - Guarda folio/acta de baja, motivo detallado y usuario que autorizó la baja.
   - Opción de **Reactivar** (para reincorporar equipos rescatados) o **Eliminación Definitiva** (solo SuperAdmin).

5. **`5. Transferencias entre Plantas`**:
   - Filtro estricto que muestra **únicamente equipos reubicados físicamente entre plantas distintas** (`Planta Actual ≠ Planta Origen`).
   - Evita falsos positivos de movimientos internos.
   - Si el equipo regresa a su planta origen, vuelve automáticamente a su pestaña estándar.

6. **`6. Equipos Dañados & Con Fallas`**:
   - Bandeja técnica de equipos reportados con fallas de hardware, pantallas rotas o errores de sistema.
   - **Acción Reparado:** Permite registrar notas de reparación técnica y regresar el equipo al inventario disponible.

---

## 4. Sistema de Checklists Técnicos y Plantillas

Diseñado para garantizar que ningún equipo crítico de cómputo sea entregado a un colaborador sin haber sido verificado técnica y operativamente.

### Regla de Obligatoriedad por Categoría:
- **Requieren Checklist Obligatorio:**
  - 💻 **Laptops / Notebooks**
  - 🖥️ **PCs / Desktops / Computadoras**
  - 🏢 **Mini PCs**
  - 📱 **Tablets / iPads**
  - 🎛️ **Paneles (Paneles Industriales / Displays)**
- **Omiten Checklist (Pasan directo a Responsiva):** Monitores, teclados, mouses, lectores QR, impresoras, cables, adaptadores y consumibles.

### Secciones del Checklist:
- **Sección A:** Estado Físico & Hardware (Carcasa, pantalla, teclado, puertos USB, cargador/fuente, batería, número de serie verificado).
- **Sección B:** Configuración Lógica & Software (Dominio COFICAB, Windows activado, Antivirus corporativo, BitLocker encriptado, usuario perfilado, drivers actualizados).
- **Opciones por Elemento:** `OK` (Conforme), `PTE` (Pendiente), `N/A` (No Aplica).
- **Edición en Tiempo Real:** El técnico puede agregar nuevos ítems dinámicos (`+ Agregar Ítem`) o eliminar ítems que no apliquen a ese dispositivo (`🗑️`).

### Sistema de Plantillas Inteligentes:
- **Guardar como Plantilla:** El técnico puede guardar la configuración actual de un checklist como una plantilla reutilizable asignada a una planta.
- **Persistencia de Estados:** Las plantillas guardan tanto la lista de tareas como los estados marcados (`OK`, `PTE`, `N/A`) para evitar capturas repetitivas.
- **Gestor de Plantillas:** Modal para listar, aplicar o eliminar plantillas personalizadas.

### Doble Firma y Seguridad:
- Firma táctil y confirmación de contraseña del Técnico IT que entrega.
- Firma táctil del Colaborador o Receptor que valida la entrega.
- **Regla de Reasignación:** Al devolver un equipo desasignado, su checklist previo queda invalidado (`VOIDED`), garantizando que cuando vuelva a ser asignado meses después, el sistema exija un checklist nuevo y fresco.

---

## 5. Sistema de Responsivas Digitales y Firmas

Generación y resguardo legal de responsivas de resguardo de equipo.

- **Datos Incluidos:** Nombre del colaborador, número de nómina/gafete, departamento/área, puesto, fecha, marca, modelo, número de serie, SKU y lista de accesorios entregados (mochila, cargador, mouse, candado, etc.).
- **Evidencia Fotográfica:** Captura o subida de fotografías del estado estético del equipo.
- **Firma Táctil Digital:** Canvas interactivo compatible con pantalla táctil de celular/tablet o mouse de PC.
- **Generación de PDF Oficial:** Plantilla membretada institucional de COFICAB con código QR de verificación de autenticidad.
- **Envío por Correo Electrónico:** Envío automático del PDF al correo corporativo del colaborador vía SMTP.
- **Historial de Responsivas (`ResponsivasHistory.tsx`):** Repositorio histórico con buscador por colaborador, folio, SKU o fecha, con opción de previsualizar, reimprimir o reenviar el PDF.

---

## 6. Escáner Móvil y Pistola Física con Acciones Contextuales

Diseñado con enfoque *Mobile-First* para que los técnicos IT realicen el 100% de sus actividades desde el piso de producción o taller usando su smartphone.

### Métodos de Captura:
1. **Cámara Móvil:** Compatible con cámaras traseras de iOS y Android con enfoque automático y detector continuo.
2. **Pistola Lector Físico:** Modo optimizado para lectores de código de barras/QR USB y Bluetooth sin interferencia de teclado virtual.

### Panel de Acciones Contextual (según estado del equipo):
Al escanear un activo, el sistema detecta su estado y muestra exclusivamente las acciones válidas:
- **Si está Disponible:**
  - 🟢 **Asignar Equipo:** Abre el Checklist obligatorio (si es Laptop/PC/Tablet/Panel) o va directo a la Responsiva.
  - 🟡 **Reportar Falla:** Abre modal para registrar falla y mover a dañados.
  - 🚛 **Trasladar de Planta:** Reubica el equipo a Planta 1, 2, 3 o UPCAST.
  - 🔧 **Mantenimiento:** Abre la lista de tareas preventivas.
- **Si está Asignado:**
  - ↩️ **Devolver al Almacén IT:** Retira el equipo del colaborador y lo devuelve a stock.
  - 🟡 **Reportar Falla** / 🚛 **Traslado** / 🔧 **Mantenimiento**.
- **Si tiene Falla:**
  - ✅ **Marcar como Reparado:** Registra notas técnicas y lo regresa a Disponible.
  - 🗑️ **Dar de Baja / Scrap**.
- **Si está en Scrap:**
  - ♻️ **Reactivar al Inventario** (solo administradores).
- **Acciones Rápidas Globales:**
  - 🏷️ **Ver QR** (muestra código grande para reimpresión).
  - ⏱️ **Historial / Línea de Tiempo** (todas las transacciones del activo).
  - ✏️ **Editar Datos**.

---

## 7. Módulo de Préstamos Temporales de IT

Administración ágil de equipos de uso temporal sin requerir responsiva definitiva:

- **Registro Rápido:** Selección del equipo en stock, nombre del solicitante, área, número de gafete y fecha/hora programada de devolución.
- **Cálculo Automático de Retorno:** Sugiere por defecto 24 horas laborables con posibilidad de ajuste.
- **Alertas Visuales de Vencimiento:** Indicador en rojo (`OVERDUE`) para préstamos con fecha de retorno expirada.
- **Devolución en 1 Clic:** Registra el reingreso al almacén IT, liberando el activo para nuevos préstamos o asignaciones.
- **Exportación a Excel:** Reporte descargable de todos los préstamos activos e históricos.

---

## 8. Módulo de Mantenimiento Preventivo y Matriz de Tareas

Seguimiento periódico del estado físico y lógico de los dispositivos corporativos.

### Matriz de Frecuencias y Tareas Automatizadas:

| Tipo de Dispositivo | Frecuencia | Tareas Estándar |
|---|:---:|---|
| **Laptops** | Cada 6 meses (180 días) | Actualización Windows, Drivers, Check disk, Limpieza interna/externa, Revisión física, Antivirus corporativo. |
| **PCs & Mini PCs** | Cada 6 meses (180 días) | Actualización Windows, Drivers, Check disk, Sopleteado/Limpieza, Revisión de ventiladores y pasta térmica, Antivirus. |
| **Tablets** | Cada 6 meses (180 días) | Actualización sistema/Play Store, Drivers, Limpieza de pantalla, Revisión de batería y centro de carga. |
| **Paneles Industriales** | Cada 4 meses (120 días) | Limpieza de pantalla táctil, Revisión de cableado y fuentes de energía, Calibración táctil, Inspección de montaje físico. |
| **Impresoras Zebra** | Cada mes (30 días) | Limpieza profunda de cabezal térmico, Limpieza de rodillos, Calibración de etiquetas, Revisión de sensor. |
| **Impresoras Láser/Oficina** | Cada 3 meses (90 días) | Limpieza de rodillos, Bandejas de papel, Nivel de tóner/tambor, Pruebas de atasco y calidad de impresión. |
| **Líneas de Producción** | Cada 4 meses (120 días) | Limpieza de gabinetes, Cableado estructurado, Pruebas de conectividad y switches de piso. |

- **Semáforo de Vencimiento:** Countdown en días (`Mantenimiento en X días`, `Vence HOY`, `Vencido hace X días`).
- **Historial de Mantenimientos:** Bitácora inmutable por activo con técnico ejecutor, checklist aplicado y observaciones.

---

## 9. Módulo de Órdenes de Compra y Requisiciones

Control del ciclo de abastecimiento de nuevos activos y consumibles de IT:

- **Creación de Órdenes (PO):** Registro de proveedor, cotización, fecha estimada de entrega, ítems solicitados, costos y categorías.
- **Flujo de Estados:** `PENDING` (Pendiente) ➔ `APPROVED` (Aprobada) ➔ `ORDERED` (Pedida) ➔ `RECEIVED` (Recibida) ➔ `CANCELLED` (Cancelada).
- **Ingreso Automático a Inventario:** Al marcar una orden como `RECEIVED`, el sistema ofrece dar de alta automáticamente los activos nuevos en el inventario disponible con sus SKUs y números de serie generados.
- **Reportes Formales en PDF:** Generador de carátula de requisición institucional con firmas de autorización.

---

## 10. Impresión de Etiquetas Térmicas y Códigos QR

Generación de etiquetas físicas para identificación inmediata de hardware:

- **Formatos Compatibles:**
  - Etiquetas Térmicas Estándar (51mm x 25mm / 2" x 1").
  - Formato de etiqueta industrial Zebra.
  - Etiquetas multipropósito para hoja carta (grid de stickers).
- **Contenido de la Etiqueta:**
  - Logotipo institucional COFICAB.
  - Código QR de alta densidad (payload único).
  - Nombre del Activo y Modelo.
  - SKU y Número de Serie.
  - Planta de asignación.
- **Impresión Masiva (Batch Print):** Selección múltiple de artículos mediante casillas de verificación (`checkboxes`) en la tabla de inventario para mandar a imprimir lotes completos de etiquetas en un solo clic.

---

## 11. Dashboard para Pantallas TV en Tiempo Real

Vista panorámica de alta visibilidad (`TVDashboard.tsx`) diseñada para pantallas montadas en las paredes del taller de IT o salas de monitoreo:

- **Métricas Clave en Vivo:**
  - Total de Activos Registrados.
  - Equipos Disponibles en Almacén IT.
  - Equipos Asignados a Colaboradores.
  - Préstamos Activos y Préstamos Vencidos.
  - Equipos en Scrap / Bajas.
  - Alertas de Stock Bajo de Consumibles y Refacciones.
- **Feed de Actividad en Tiempo Real:** Lista cronológica de los últimos movimientos realizados (asignaciones, mantenimientos, entradas, salidas y préstamos).
- **Diseño Glassmorphism de Alto Contraste:** Optimizado para visualización a distancia y bajo consumo de recursos con auto-refresco periódico.

---

## 12. Administración de Usuarios y Seguridad

Control centralizado de credenciales y accesos (`AdminDashboard.tsx`):

- **Gestión de Cuentas:** Creación de nuevos usuarios, asignación de rol y vinculación a una planta física determinada.
- **Restablecimiento de Contraseñas:** Permite a los administradores actualizar contraseñas o recuperar cuentas de operadores.
- **Protección de Datos Sensibles:**
  - Enmascaramiento de llaves BitLocker (`••••••••`) y contraseñas de BIOS/dispositivo en listados generales para evitar fugas de información.
  - Desbloqueo seguro mediante modal de confirmación con contraseña de administrador.
- **Protección de Auto-Eliminación:** El sistema impide que un administrador borre su propia cuenta activa.

---

## 13. Auditoría, Trazabilidad y Línea de Tiempo

Cada evento ocurrido en el sistema genera un registro inmutable en la tabla de transacciones:

- **Tipos de Eventos Auditados:**
  - `CREATION` — Alta inicial del activo en el sistema.
  - `INBOUND` / `OUTBOUND` — Entradas y salidas de stock con cantidades y receptor.
  - `TRANSFER` — Traslados entre plantas físicas (`Planta Origen ➔ Planta Destino`).
  - `EDIT` — Modificación de atributos, especificaciones o ubicación.
  - `MAINTENANCE` — Mantenimiento preventivo con tareas ejecutadas.
  - `RESPONSIVA` — Firma de responsiva y asignación a colaborador.
  - `DECOMMISSION` — Envío a scrap con acta y motivo de baja.
  - `REACTIVATE` — Reactivación de un equipo dado de baja.
- **Modal de Línea de Tiempo (`AssetTimelineModal`):** Visualización gráfica vertical cronológica que muestra la historia de vida completa de cada equipo desde el día de su compra hasta su disposición final.

---

### 🏁 Resumen Ejecutivo

El **Sistema de Inventario COFICAB IT** cubre el ciclo de vida completo de los activos tecnológicos de la empresa:
1. **Compras & Recepción** (Requisiciones ➔ Ingreso automático al almacén).
2. **Preparación Técnica** (Checklist de control con plantillas personalizadas).
3. **Entrega Formal** (Responsiva digital con firma táctil, fotos y PDF por correo).
4. **Operación en Planta** (Control de traslados entre plantas y préstamos rápidos).
5. **Mantenimiento Preventivo** (Matriz de tareas por dispositivo con semáforo de alertas).
6. **Disposición Final** (Scrap, actas de baja E-Waste y reactivación auditada).
