# Legal, pagos y facturación — MVP Connectly

---

## 1. Términos y condiciones en el registro

### Cuándo aparece
- En el último paso del registro (antes de crear la cuenta)
- Checkbox obligatorio — no se puede completar el registro sin marcarlo
- También en la primera vez que se hace un pago

### Texto del checkbox
"He leído y acepto los [Términos y Condiciones] y la [Política de Privacidad] de Connectly.
Entiendo que Connectly actúa únicamente como plataforma intermediaria y no se hace responsable
de los acuerdos, contenidos, resultados o daños derivados de las colaboraciones entre marcas
y creadores."

### Cláusulas clave a incluir en los T&C
- Connectly es una plataforma intermediaria, no parte del acuerdo entre marca y creador
- Connectly no garantiza resultados de las colaboraciones
- Connectly no se hace responsable de daños directos, indirectos o lucro cesante
- El usuario es responsable del contenido que publica y comparte
- Las disputas entre marca y creador se resuelven entre las partes — Connectly puede mediar pero no tiene obligación legal de resolver
- La comisión de Connectly es irretornable una vez iniciado el proyecto
- Ley aplicable: española. Jurisdicción: tribunales de Sevilla

### Almacenamiento del consentimiento
```sql
ALTER TABLE marketplace_users
  ADD COLUMN terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN terms_version TEXT DEFAULT '1.0';
```
Guardar versión de T&C aceptada — si se actualizan los términos, pedir aceptación de nuevo.

---

## 2. Sistema de pagos — modelo Wallapop

### Flujo completo
```
Marca acuerda colaboración con pago con creador/influencer
  ↓
Marca ingresa el importe acordado en Connectly
  (pago con tarjeta vía Stripe o transferencia bancaria)
  ↓
Connectly retiene el dinero (escrow)
  ├── Retiene X% como seguro/comisión (irretornable)
  └── Resto queda bloqueado hasta confirmación
  ↓
Creador entrega el contenido / realiza la colaboración
  ↓
Confirmación bilateral (marca confirma, creador confirma)
  ↓
Connectly libera el pago al creador:
  → Transferencia bancaria a la cuenta del creador (IBAN)
  → O saldo en cartera Connectly (para reinvertir en la plataforma)
  ↓
Ambas partes descargan su factura
```

### Porcentaje de comisión
- **UGC projects:** 20% irretornable
- **Colaboraciones influencer con pago:** 10% irretornable
- El porcentaje se retiene siempre, tanto si la colaboración se completa como si hay disputa

### Métodos de pago aceptados (MVP)
- Tarjeta de crédito/débito (Stripe)
- Transferencia bancaria (manual en MVP, automatizable en V2)

### Cobro al creador
- Transferencia bancaria al IBAN que el creador introduce en su perfil
- Plazo: 3-5 días hábiles tras la liberación del pago
- Mínimo de pago: 50€ (por debajo queda en saldo hasta acumular el mínimo)

### Tabla Supabase necesaria
```sql
-- Añadir IBAN al perfil del creador
ALTER TABLE influencer_profiles
  ADD COLUMN bank_iban TEXT,
  ADD COLUMN bank_holder_name TEXT,
  ADD COLUMN bank_verified BOOLEAN DEFAULT FALSE;

-- Pagos retenidos (escrow)
CREATE TABLE escrow_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_user_id         UUID NOT NULL REFERENCES marketplace_users(id),
  payee_user_id         UUID NOT NULL REFERENCES marketplace_users(id),
  collaboration_id      UUID REFERENCES collaborations(id),
  ugc_project_id        UUID REFERENCES ugc_projects(id),
  gross_amount_cents    INT NOT NULL,
  platform_fee_cents    INT NOT NULL,   -- irretornable siempre
  net_amount_cents      INT NOT NULL,   -- lo que cobra el creador
  status                TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held','released','disputed','refunded_partial')),
  stripe_payment_id     TEXT,
  held_at               TIMESTAMPTZ DEFAULT NOW(),
  released_at           TIMESTAMPTZ,
  transfer_reference    TEXT,           -- referencia de la transferencia bancaria
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Facturación

### Quién recibe factura
- **Marca:** factura por cada pago realizado (importe bruto + comisión desglosada)
- **Creador:** factura/liquidación por cada cobro recibido (importe neto tras comisión)

### Datos necesarios para facturar
**Marca:**
- Nombre o razón social
- NIF/CIF
- Dirección fiscal
- Email de facturación

**Creador:**
- Nombre completo o razón social
- NIF
- Dirección fiscal
- Email

```sql
-- Añadir datos fiscales a ambos perfiles
ALTER TABLE brand_profiles
  ADD COLUMN fiscal_name TEXT,
  ADD COLUMN fiscal_nif TEXT,
  ADD COLUMN fiscal_address TEXT,
  ADD COLUMN billing_email TEXT;

ALTER TABLE influencer_profiles
  ADD COLUMN fiscal_name TEXT,
  ADD COLUMN fiscal_nif TEXT,
  ADD COLUMN fiscal_address TEXT,
  ADD COLUMN billing_email TEXT;

-- Tabla de facturas
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT UNIQUE NOT NULL,  -- formato: CNX-2026-0001
  user_id         UUID NOT NULL REFERENCES marketplace_users(id),
  escrow_id       UUID REFERENCES escrow_payments(id),
  type            TEXT NOT NULL CHECK (type IN ('charge', 'payout')),
  -- charge = cobro a marca, payout = liquidación a creador
  amount_cents    INT NOT NULL,
  tax_rate        DECIMAL(4,2) DEFAULT 21.00,  -- IVA 21%
  tax_amount_cents INT,
  total_cents     INT,
  pdf_url         TEXT,   -- URL del PDF generado en Supabase Storage
  issued_at       TIMESTAMPTZ DEFAULT NOW(),
  due_at          TIMESTAMPTZ
);
```

### Generación del PDF
- Librería: `pdf-lib` o `@react-pdf/renderer` en Next.js
- Se genera automáticamente al liberar el pago
- Se sube a Supabase Storage y se guarda la URL en `invoices.pdf_url`
- El usuario puede descargarlo desde su dashboard en cualquier momento

### Numeración de facturas
- Formato: `CNX-YYYY-NNNN` (ej: CNX-2026-0001)
- Secuencia correlativa por año, obligatorio para cumplimiento fiscal español

---

## Orden de implementación sugerido

1. Términos y condiciones en el registro (1-2h) — bloquea el lanzamiento
2. Datos fiscales en perfiles (30min SQL + formulario)
3. Escrow básico con Stripe (el más complejo — 1-2 días)
4. Generación de facturas PDF (medio día)
5. IBAN del creador y transferencias (puede ser manual en MVP)
