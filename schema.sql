-- ==============================================================================
-- CineStore - Correção de Permissões RLS do Supabase
-- Copie e cole este script no SQL Editor do Supabase para liberar o cadastro!
-- ==============================================================================

-- 1. Cria ou ajusta a tabela de Filmes e Séries
CREATE TABLE IF NOT EXISTS public.movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tmdb_id BIGINT,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'movie', -- 'movie' ou 'series'
    category VARCHAR(100) DEFAULT 'Cinema',
    genre_ids JSONB DEFAULT '[]'::jsonb,
    year VARCHAR(10) DEFAULT '2026',
    rating NUMERIC(3, 1) DEFAULT 8.5,
    price NUMERIC(10, 2) NOT NULL DEFAULT 24.90,
    image TEXT NOT NULL,
    backdrop TEXT,
    description TEXT,
    trailer_url TEXT,
    stream_url TEXT,
    duration VARCHAR(50) DEFAULT '2h 15m',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DESABILITAR RLS NA TABELA MOVIES (Permite que o Painel Admin salve sem bloqueio)
ALTER TABLE public.movies DISABLE ROW LEVEL SECURITY;

-- 3. Caso queira manter RLS ativado, esta política abaixo libera para a chave anônima:
/*
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para anon e authenticated" ON public.movies;
CREATE POLICY "Permitir acesso total para anon e authenticated"
ON public.movies FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
*/
