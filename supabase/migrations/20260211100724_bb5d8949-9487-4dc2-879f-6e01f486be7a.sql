
-- =============================================
-- Fix clientes_orcamentos: restrict to admin role
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clientes_orcamentos;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clientes_orcamentos;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clientes_orcamentos;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clientes_orcamentos;

CREATE POLICY "Admins podem gerenciar clientes" ON public.clientes_orcamentos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem ver clientes" ON public.clientes_orcamentos
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Fix fornecedores + related tables: restrict to admin/rh
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can delete fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated users can insert fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated users can update fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON public.fornecedores;

CREATE POLICY "Admins e RH podem gerenciar fornecedores" ON public.fornecedores
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

CREATE POLICY "Admins e RH podem ver fornecedores" ON public.fornecedores
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

-- enderecos_fornecedor
DROP POLICY IF EXISTS "Authenticated users can delete enderecos" ON public.enderecos_fornecedor;
DROP POLICY IF EXISTS "Authenticated users can insert enderecos" ON public.enderecos_fornecedor;
DROP POLICY IF EXISTS "Authenticated users can update enderecos" ON public.enderecos_fornecedor;
DROP POLICY IF EXISTS "Authenticated users can view enderecos" ON public.enderecos_fornecedor;

CREATE POLICY "Admins e RH podem gerenciar enderecos" ON public.enderecos_fornecedor
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

CREATE POLICY "Admins e RH podem ver enderecos" ON public.enderecos_fornecedor
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

-- itens_fornecedor
DROP POLICY IF EXISTS "Authenticated users can delete itens" ON public.itens_fornecedor;
DROP POLICY IF EXISTS "Authenticated users can insert itens" ON public.itens_fornecedor;
DROP POLICY IF EXISTS "Authenticated users can update itens" ON public.itens_fornecedor;
DROP POLICY IF EXISTS "Authenticated users can view itens" ON public.itens_fornecedor;

CREATE POLICY "Admins e RH podem gerenciar itens fornecedor" ON public.itens_fornecedor
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

CREATE POLICY "Admins e RH podem ver itens fornecedor" ON public.itens_fornecedor
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

-- documentos_fornecedor
DROP POLICY IF EXISTS "Authenticated users can delete documentos" ON public.documentos_fornecedor;
DROP POLICY IF EXISTS "Authenticated users can insert documentos" ON public.documentos_fornecedor;
DROP POLICY IF EXISTS "Authenticated users can view documentos" ON public.documentos_fornecedor;

CREATE POLICY "Admins e RH podem gerenciar docs fornecedor" ON public.documentos_fornecedor
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

CREATE POLICY "Admins e RH podem ver docs fornecedor" ON public.documentos_fornecedor
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

-- historico_precos_fornecedor
DROP POLICY IF EXISTS "Authenticated users can view historico" ON public.historico_precos_fornecedor;
DROP POLICY IF EXISTS "System can insert historico" ON public.historico_precos_fornecedor;

CREATE POLICY "Admins e RH podem ver historico precos" ON public.historico_precos_fornecedor
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

CREATE POLICY "Sistema pode inserir historico precos" ON public.historico_precos_fornecedor
  FOR INSERT WITH CHECK (true);

-- =============================================
-- Fix inventario_equipamentos: restrict to admin
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can delete equipamentos" ON public.inventario_equipamentos;
DROP POLICY IF EXISTS "Authenticated users can insert equipamentos" ON public.inventario_equipamentos;
DROP POLICY IF EXISTS "Authenticated users can update equipamentos" ON public.inventario_equipamentos;
DROP POLICY IF EXISTS "Authenticated users can view equipamentos" ON public.inventario_equipamentos;

CREATE POLICY "Admins podem gerenciar equipamentos" ON public.inventario_equipamentos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem ver equipamentos" ON public.inventario_equipamentos
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Fix itens_orcamento: restrict to admin
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can delete items" ON public.itens_orcamento;
DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.itens_orcamento;
DROP POLICY IF EXISTS "Authenticated users can update items" ON public.itens_orcamento;
DROP POLICY IF EXISTS "Authenticated users can view items" ON public.itens_orcamento;

CREATE POLICY "Admins podem gerenciar itens orcamento" ON public.itens_orcamento
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem ver itens orcamento" ON public.itens_orcamento
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
