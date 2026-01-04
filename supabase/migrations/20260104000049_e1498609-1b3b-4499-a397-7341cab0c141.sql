-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Legal documents table
CREATE TABLE public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL UNIQUE CHECK (type IN ('terms', 'privacy', 'data_processing')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Everyone can read legal documents
CREATE POLICY "Everyone can read legal documents"
ON public.legal_documents
FOR SELECT
USING (true);

-- Only admins can update legal documents
CREATE POLICY "Admins can update legal documents"
ON public.legal_documents
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert legal documents"
ON public.legal_documents
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User permissions table
CREATE TABLE public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    analytics_enabled BOOLEAN NOT NULL DEFAULT true,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    personalized_ads BOOLEAN NOT NULL DEFAULT false,
    data_sharing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own permissions
CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own permissions"
ON public.user_permissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own permissions"
ON public.user_permissions
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert default legal documents
INSERT INTO public.legal_documents (type, title, content) VALUES
('terms', 'Условия использования', '# Условия использования

1. **Общие положения**
   - Данное приложение предоставляется "как есть".
   - Используя приложение, вы соглашаетесь с данными условиями.

2. **Права и обязанности**
   - Пользователь обязуется использовать приложение законно.
   - Разработчик оставляет право изменять функционал.

3. **Ответственность**
   - Разработчик не несёт ответственности за потерю данных.'),
('privacy', 'Политика конфиденциальности', '# Политика конфиденциальности

1. **Сбор данных**
   - Мы собираем данные, которые вы вводите в приложение.
   - Данные хранятся защищённо.

2. **Использование данных**
   - Данные используются для работы приложения.
   - Мы не продаём ваши данные третьим лицам.

3. **Защита данных**
   - Данные передаются по защищённому соединению.'),
('data_processing', 'Политика обработки персональных данных', '# Политика обработки персональных данных

1. **Оператор**
   - Оператором персональных данных является разработчик приложения.

2. **Цели обработки**
   - Персональные данные обрабатываются для предоставления услуг.

3. **Права субъекта**
   - Вы имеете право на доступ, изменение и удаление своих данных.');