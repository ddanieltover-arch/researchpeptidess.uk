-- Research Peptides UK — persistence hardening (additive, non-destructive)

CREATE TABLE IF NOT EXISTS product_merchandising (
  product_id text PRIMARY KEY,
  featured boolean NOT NULL DEFAULT false,
  bestseller_override boolean NOT NULL DEFAULT false,
  bestseller_excluded boolean NOT NULL DEFAULT false,
  new_arrival_override boolean NOT NULL DEFAULT false,
  hide_from_homepage boolean NOT NULL DEFAULT false,
  merchandising_priority integer NOT NULL DEFAULT 0,
  merchandising_updated_at timestamp NOT NULL DEFAULT now(),
  merchandising_updated_by text
);

CREATE INDEX IF NOT EXISTS product_merchandising_featured_idx ON product_merchandising (featured);
CREATE INDEX IF NOT EXISTS product_merchandising_priority_idx ON product_merchandising (merchandising_priority);

CREATE TABLE IF NOT EXISTS merchandising_audit (
  id text PRIMARY KEY,
  actor text NOT NULL,
  actor_id text,
  product_id text NOT NULL,
  action text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS merchandising_audit_product_idx ON merchandising_audit (product_id);
CREATE INDEX IF NOT EXISTS merchandising_audit_created_at_idx ON merchandising_audit (created_at);

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id text PRIMARY KEY,
  email text NOT NULL,
  topics text NOT NULL,
  consent_timestamp timestamp NOT NULL,
  consent_source text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  unsubscribe_status text NOT NULL DEFAULT 'SUBSCRIBED',
  provider_status text NOT NULL DEFAULT 'NOT_CONNECTED_TO_EMAIL_PROVIDER',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscriptions_email_idx ON newsletter_subscriptions (email);

CREATE TABLE IF NOT EXISTS contact_messages (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  consent boolean NOT NULL,
  status text NOT NULL DEFAULT 'NEW',
  idempotency_key text,
  ip_hash text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS contact_messages_idempotency_idx
  ON contact_messages (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages (status);
CREATE INDEX IF NOT EXISTS contact_messages_ip_hash_idx ON contact_messages (ip_hash);

CREATE TABLE IF NOT EXISTS store_settings (
  id text PRIMARY KEY,
  payload_json text NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now(),
  updated_by text
);

CREATE TABLE IF NOT EXISTS order_payments (
  id text PRIMARY KEY,
  order_id text NOT NULL,
  method text NOT NULL,
  amount_pence integer NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL,
  reference text,
  transaction_hash text,
  evidence_notes text,
  payload_json text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_payments_order_idx ON order_payments (order_id);

CREATE TABLE IF NOT EXISTS inventory_events (
  id text PRIMARY KEY,
  variant_id text NOT NULL,
  order_id text,
  transaction_type text NOT NULL,
  quantity_change integer NOT NULL,
  balance_after integer NOT NULL,
  notes text,
  actor_id text,
  payload_json text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_events_variant_idx ON inventory_events (variant_id);
CREATE INDEX IF NOT EXISTS inventory_events_order_idx ON inventory_events (order_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payload_json text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS app_status text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_idx
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
