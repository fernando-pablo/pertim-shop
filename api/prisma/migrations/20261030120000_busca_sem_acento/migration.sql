-- Busca da vitrine (Etapa 4C).
-- unaccent: compara sem acento ("racao" acha "Ração").
-- pg_trgm: mede a semelhança entre textos, para perdoar erros pequenos de
-- digitação ("rasao" acha "Ração").
-- As duas vêm com o PostgreSQL e podem ser ligadas pelo dono do banco.
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
