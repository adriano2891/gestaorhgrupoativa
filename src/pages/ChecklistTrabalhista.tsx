import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck, Search, Download, ChevronDown, ChevronRight,
  UserPlus, Clock, Wallet, Landmark, Palmtree, Gift,
  HardHat, FileX, ShieldAlert, Heart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ========== TYPES ==========
type Dependencia = "sistema" | "parcial" | "procedimento";
type AuditoriaStatus = "conforme" | "nao_conforme" | "nao_aplicavel" | "pendente";

interface CheckItem {
  id: string;
  nome: string;
  descricao: string;
  baseLegal: string;
  risco: string;
  dependencia: Dependencia;
}

interface Categoria {
  id: string;
  titulo: string;
  emoji: string;
  icon: React.ReactNode;
  items: CheckItem[];
}

// ========== 100+ ITEMS DATA ==========
const CATEGORIAS: Categoria[] = [
  {
    id: "admissao", titulo: "Admissão de Funcionários", emoji: "1️⃣",
    icon: <UserPlus className="h-5 w-5" />,
    items: [
      { id: "a01", nome: "Registro do empregado antes do início", descricao: "Empregado deve ser registrado antes de iniciar atividades", baseLegal: "CLT Art. 41", risco: "Multa de R$ 3.000 por empregado não registrado (R$ 800 ME/EPP)", dependencia: "parcial" },
      { id: "a02", nome: "Anotação na CTPS Digital", descricao: "Registro em até 5 dias úteis da admissão", baseLegal: "CLT Art. 29", risco: "Multa administrativa + reclamação trabalhista", dependencia: "sistema" },
      { id: "a03", nome: "Envio evento S-2200 (eSocial)", descricao: "Cadastramento inicial do vínculo no eSocial", baseLegal: "eSocial S-2200", risco: "Multa de R$ 402,54 a R$ 181.284,63", dependencia: "sistema" },
      { id: "a04", nome: "Envio evento S-1000 (eSocial)", descricao: "Informações do empregador/contribuinte", baseLegal: "eSocial S-1000", risco: "Multa por omissão de dados do empregador", dependencia: "sistema" },
      { id: "a05", nome: "Contrato de trabalho assinado", descricao: "Formalização do vínculo com cláusulas obrigatórias", baseLegal: "CLT Art. 442-456", risco: "Presunção de vínculo sem limitações contratuais", dependencia: "procedimento" },
      { id: "a06", nome: "Contrato de experiência", descricao: "Prazo máximo de 90 dias, prorrogável uma vez", baseLegal: "CLT Art. 445, parágrafo único", risco: "Conversão automática em contrato indeterminado", dependencia: "procedimento" },
      { id: "a07", nome: "Exame admissional (ASO)", descricao: "Atestar aptidão antes do início das atividades", baseLegal: "NR-7; CLT Art. 168", risco: "Multa NR-7 de R$ 1.436 a R$ 4.024 + responsabilidade por doença", dependencia: "procedimento" },
      { id: "a08", nome: "Coleta de documentos pessoais", descricao: "RG, CPF, título eleitor, certificado reservista, comprovante endereço", baseLegal: "CLT Art. 29", risco: "Risco documental e cadastral", dependencia: "procedimento" },
      { id: "a09", nome: "Foto 3x4 e dados bancários", descricao: "Documentos complementares para cadastro", baseLegal: "CLT", risco: "Atraso no processamento de folha", dependencia: "procedimento" },
      { id: "a10", nome: "Cadastro PIS/PASEP", descricao: "Verificar ou cadastrar NIS do trabalhador", baseLegal: "Lei 7.998/90", risco: "Impossibilidade de recolhimento FGTS/INSS", dependencia: "sistema" },
      { id: "a11", nome: "Cadastro no sistema de folha", descricao: "Inclusão correta de todos os dados no sistema", baseLegal: "CLT", risco: "Erros em cálculos de folha e encargos", dependencia: "sistema" },
      { id: "a12", nome: "Abertura conta FGTS", descricao: "Registro na conta vinculada do FGTS", baseLegal: "Lei 8.036/90", risco: "Multa por não depósito de FGTS", dependencia: "sistema" },
      { id: "a13", nome: "Cadastro INSS", descricao: "Vinculação previdenciária do empregado", baseLegal: "Lei 8.212/91", risco: "Multa por ausência de contribuição", dependencia: "sistema" },
      { id: "a14", nome: "Definição de cargo e função", descricao: "Compatibilidade entre cargo registrado e função exercida", baseLegal: "CLT Art. 456", risco: "Ação por desvio/acúmulo de função", dependencia: "procedimento" },
      { id: "a15", nome: "Enquadramento sindical", descricao: "Identificação do sindicato e convenção coletiva aplicável", baseLegal: "CLT Art. 511-610", risco: "Descumprimento de CCT/ACT", dependencia: "parcial" },
      { id: "a16", nome: "Entrega de regulamento interno", descricao: "Normas, políticas e código de conduta da empresa", baseLegal: "CLT Art. 444", risco: "Impossibilidade de aplicar sanções disciplinares", dependencia: "procedimento" },
      { id: "a17", nome: "Declaração de dependentes IR/SF", descricao: "Cadastro de dependentes para fins fiscais e benefícios", baseLegal: "RIR; CLT", risco: "Erro em cálculos de IRRF e salário-família", dependencia: "parcial" },
      { id: "a18", nome: "Opção vale-transporte", descricao: "Declaração de uso ou renúncia ao benefício", baseLegal: "Lei 7.418/85", risco: "Reclamação por não fornecimento de VT", dependencia: "procedimento" },
      { id: "a19", nome: "Treinamento de integração", descricao: "Apresentação de normas de segurança e procedimentos", baseLegal: "NR-1", risco: "Multa NR + responsabilidade em acidentes", dependencia: "procedimento" },
      { id: "a20", nome: "Termo de confidencialidade", descricao: "Sigilo de informações estratégicas e dados pessoais", baseLegal: "LGPD; CLT", risco: "Vazamento de dados sem responsabilização", dependencia: "procedimento" },
    ],
  },
  {
    id: "jornada", titulo: "Jornada de Trabalho", emoji: "2️⃣",
    icon: <Clock className="h-5 w-5" />,
    items: [
      { id: "j01", nome: "Controle de ponto obrigatório", descricao: "Registro de jornada para empresas com mais de 20 empregados", baseLegal: "CLT Art. 74 §2º", risco: "Multa de R$ 4.025 por empregado + inversão ônus da prova", dependencia: "parcial" },
      { id: "j02", nome: "Sistema REP conforme Portaria 671", descricao: "REP-C, REP-A ou REP-P homologado", baseLegal: "Portaria 671/2021", risco: "Multa por sistema não conforme", dependencia: "sistema" },
      { id: "j03", nome: "Emissão de comprovante de ponto", descricao: "Comprovante a cada marcação do empregado", baseLegal: "Portaria 671/2021 Art. 79", risco: "Irregularidade perante MTE", dependencia: "sistema" },
      { id: "j04", nome: "Registro fidedigno de horas", descricao: "Marcação real da jornada sem adulterações", baseLegal: "CLT Art. 74", risco: "Processo trabalhista + presunção favorável ao empregado", dependencia: "parcial" },
      { id: "j05", nome: "Limite de horas extras (2h/dia)", descricao: "Máximo de 2 horas extras diárias", baseLegal: "CLT Art. 59", risco: "Multa + nulidade de acordo", dependencia: "sistema" },
      { id: "j06", nome: "Pagamento HE dia útil (50%)", descricao: "Adicional mínimo de 50% sobre hora normal", baseLegal: "CLT Art. 59; CF Art. 7º, XVI", risco: "Diferenças salariais com reflexos", dependencia: "sistema" },
      { id: "j07", nome: "Pagamento HE DSR/feriado (100%)", descricao: "Adicional de 100% em domingos e feriados", baseLegal: "CLT Art. 70; Lei 605/49", risco: "Diferenças salariais + reflexos em férias, 13º, FGTS", dependencia: "sistema" },
      { id: "j08", nome: "Intervalo intrajornada (1h)", descricao: "Mínimo de 1h para jornada superior a 6h", baseLegal: "CLT Art. 71", risco: "Pagamento do período suprimido como HE (Art. 71 §4º)", dependencia: "parcial" },
      { id: "j09", nome: "Intervalo intrajornada curto (15min)", descricao: "15 minutos para jornada de 4h a 6h", baseLegal: "CLT Art. 71 §1º", risco: "Multa + pagamento como HE", dependencia: "parcial" },
      { id: "j10", nome: "Intervalo interjornada (11h)", descricao: "Mínimo de 11h entre duas jornadas", baseLegal: "CLT Art. 66", risco: "HE sobre período suprimido (OJ 355 SDI-1 TST)", dependencia: "parcial" },
      { id: "j11", nome: "Descanso semanal remunerado", descricao: "24h consecutivas, preferencialmente aos domingos", baseLegal: "Lei 605/49; CF Art. 7º, XV", risco: "Multa + pagamento em dobro", dependencia: "sistema" },
      { id: "j12", nome: "DSR sobre horas extras habituais", descricao: "Reflexo de HE habituais no DSR", baseLegal: "Súmula 172 TST", risco: "Diferenças salariais", dependencia: "sistema" },
      { id: "j13", nome: "Banco de horas — acordo formal", descricao: "Acordo individual escrito (6 meses) ou coletivo (12 meses)", baseLegal: "CLT Art. 59 §2º e §5º", risco: "Nulidade e pagamento integral de HE", dependencia: "parcial" },
      { id: "j14", nome: "Banco de horas — compensação no prazo", descricao: "Compensação dentro do prazo legal", baseLegal: "CLT Art. 59 §5º", risco: "Pagamento de todas as horas como extras", dependencia: "sistema" },
      { id: "j15", nome: "Escalas de trabalho documentadas", descricao: "Escalas 12x36, turnos ininterruptos com acordo", baseLegal: "CLT Art. 59-A", risco: "Nulidade da escala + HE", dependencia: "procedimento" },
      { id: "j16", nome: "Tolerância de ponto (10min/dia)", descricao: "Variações até 5min por marcação, máximo 10min/dia", baseLegal: "CLT Art. 58 §1º", risco: "Pagamento de minutos excedentes como HE", dependencia: "sistema" },
      { id: "j17", nome: "Controle de sobreaviso", descricao: "Registro de horas em regime de sobreaviso", baseLegal: "CLT Art. 244 §2º; Súmula 428 TST", risco: "Pagamento de 1/3 da hora normal", dependencia: "parcial" },
      { id: "j18", nome: "Jornada do menor aprendiz", descricao: "Máximo 6h/dia (sem ensino fundamental) ou 8h (com)", baseLegal: "CLT Art. 432", risco: "Multa + nulidade do contrato", dependencia: "parcial" },
    ],
  },
  {
    id: "folha", titulo: "Folha de Pagamento", emoji: "3️⃣",
    icon: <Wallet className="h-5 w-5" />,
    items: [
      { id: "f01", nome: "Elaboração mensal da folha", descricao: "Cálculo correto de todas as verbas mensais", baseLegal: "CLT Art. 459-466", risco: "Reclamação trabalhista + multa Art. 510 CLT", dependencia: "sistema" },
      { id: "f02", nome: "Pagamento até 5º dia útil", descricao: "Prazo legal para crédito do salário", baseLegal: "CLT Art. 459 §1º", risco: "Multa + correção monetária + juros", dependencia: "procedimento" },
      { id: "f03", nome: "Cálculo correto de horas extras", descricao: "Percentuais corretos (50%, 100%) com reflexos", baseLegal: "CLT Art. 59", risco: "Diferenças salariais com reflexos em férias, 13º, FGTS", dependencia: "sistema" },
      { id: "f04", nome: "Adicional noturno (20%)", descricao: "Mínimo de 20% sobre hora diurna, hora reduzida 52min30s", baseLegal: "CLT Art. 73", risco: "Diferenças salariais + reflexos", dependencia: "sistema" },
      { id: "f05", nome: "Prorrogação do adicional noturno", descricao: "Jornada noturna que se estende após 5h mantém adicional", baseLegal: "Súmula 60, II TST", risco: "Diferenças salariais", dependencia: "sistema" },
      { id: "f06", nome: "Adicional de insalubridade", descricao: "10%, 20% ou 40% do salário mínimo conforme grau", baseLegal: "CLT Art. 189-197; NR-15", risco: "Ação judicial + diferenças + reflexos", dependencia: "parcial" },
      { id: "f07", nome: "Adicional de periculosidade (30%)", descricao: "30% sobre salário base para atividades perigosas", baseLegal: "CLT Art. 193", risco: "Ação judicial + diferenças + reflexos", dependencia: "parcial" },
      { id: "f08", nome: "Salário-família", descricao: "Pagamento conforme tabela do INSS por dependente", baseLegal: "Lei 8.213/91 Art. 65-70", risco: "Multa + diferenças ao empregado", dependencia: "sistema" },
      { id: "f09", nome: "Desconto de IRRF correto", descricao: "Aplicação correta da tabela progressiva", baseLegal: "RIR/99; IN RFB", risco: "Multa da Receita Federal + retenção incorreta", dependencia: "sistema" },
      { id: "f10", nome: "Desconto de VT (máx. 6%)", descricao: "Desconto limitado a 6% do salário base", baseLegal: "Lei 7.418/85; Decreto 95.247/87", risco: "Reclamação por desconto indevido", dependencia: "parcial" },
      { id: "f11", nome: "Descontos autorizados por escrito", descricao: "Todo desconto deve ter autorização expressa do empregado", baseLegal: "CLT Art. 462", risco: "Reclamação trabalhista + devolução em dobro", dependencia: "procedimento" },
      { id: "f12", nome: "Entrega de holerite/contracheque", descricao: "Demonstrativo detalhado de pagamento mensal", baseLegal: "CLT Art. 464", risco: "Reclamação por falta de transparência", dependencia: "procedimento" },
      { id: "f13", nome: "Integração de comissões e prêmios", descricao: "Reflexos de comissões habituais em verbas trabalhistas", baseLegal: "CLT Art. 457 §1º", risco: "Diferenças salariais com reflexos", dependencia: "sistema" },
      { id: "f14", nome: "Equiparação salarial", descricao: "Mesmo salário para mesma função, mesmo empregador, mesma localidade", baseLegal: "CLT Art. 461", risco: "Ação de equiparação + diferenças retroativas", dependencia: "procedimento" },
      { id: "f15", nome: "Piso salarial da categoria", descricao: "Respeitar piso definido em CCT/ACT", baseLegal: "CLT Art. 611-A", risco: "Diferenças salariais + multa sindical", dependencia: "parcial" },
    ],
  },
  {
    id: "encargos", titulo: "Encargos e Tributos Trabalhistas", emoji: "4️⃣",
    icon: <Landmark className="h-5 w-5" />,
    items: [
      { id: "e01", nome: "Depósito FGTS mensal (8%)", descricao: "8% sobre remuneração bruta até dia 7 do mês seguinte", baseLegal: "Lei 8.036/90 Art. 15", risco: "Multa de 5% no mês + 10% após + TR + juros", dependencia: "sistema" },
      { id: "e02", nome: "FGTS sobre 13º salário", descricao: "Recolhimento de 8% sobre cada parcela do 13º", baseLegal: "Lei 8.036/90", risco: "Multa + juros", dependencia: "sistema" },
      { id: "e03", nome: "FGTS sobre férias + 1/3", descricao: "Recolhimento de 8% sobre férias gozadas", baseLegal: "Lei 8.036/90", risco: "Multa + diferenças", dependencia: "sistema" },
      { id: "e04", nome: "FGTS rescisório", descricao: "Depósito correto do mês da rescisão + aviso prévio indenizado", baseLegal: "Lei 8.036/90", risco: "Bloqueio de certidão + multa", dependencia: "sistema" },
      { id: "e05", nome: "INSS empregado — desconto correto", descricao: "Alíquotas progressivas conforme faixa salarial", baseLegal: "Lei 8.212/91; EC 103/2019", risco: "Multa + apropriação indébita (Art. 168-A CP)", dependencia: "sistema" },
      { id: "e06", nome: "INSS patronal", descricao: "20% sobre folha + RAT + FAP + terceiros", baseLegal: "Lei 8.212/91 Art. 22", risco: "Multa + juros SELIC + representação fiscal", dependencia: "sistema" },
      { id: "e07", nome: "Envio DCTFWeb mensal", descricao: "Declaração de débitos e créditos tributários previdenciários", baseLegal: "IN RFB 2.005/2021", risco: "Multa de 2% sobre contribuições + R$ 20/grupo de 10 informações", dependencia: "sistema" },
      { id: "e08", nome: "Envio eSocial — eventos periódicos", descricao: "S-1200 (remuneração), S-1210 (pagamento) mensais", baseLegal: "eSocial", risco: "Multa por evento: R$ 402 a R$ 181.284", dependencia: "sistema" },
      { id: "e09", nome: "Envio eSocial — eventos não periódicos", descricao: "S-2200, S-2206, S-2230, S-2299 nos prazos", baseLegal: "eSocial", risco: "Multa por omissão ou atraso", dependencia: "sistema" },
      { id: "e10", nome: "DIRF/EFD-Reinf", descricao: "Informações de retenções na fonte", baseLegal: "IN RFB", risco: "Multa por omissão", dependencia: "sistema" },
      { id: "e11", nome: "RAIS / substituição eSocial", descricao: "Informações anuais de vínculos (substituída pelo eSocial)", baseLegal: "Decreto 76.900/75", risco: "Multa de R$ 425 a R$ 42.564", dependencia: "sistema" },
      { id: "e12", nome: "CAGED / substituição eSocial", descricao: "Comunicação de admissões e desligamentos", baseLegal: "Lei 4.923/65", risco: "Multa por não comunicação", dependencia: "sistema" },
      { id: "e13", nome: "Contribuição sindical", descricao: "Recolhimento mediante autorização expressa do empregado", baseLegal: "CLT Art. 578-593; Reforma Trabalhista", risco: "Desconto indevido sem autorização", dependencia: "parcial" },
      { id: "e14", nome: "Retenção e recolhimento de pensão alimentícia", descricao: "Cumprimento de determinação judicial", baseLegal: "CPC; Código Penal Art. 244", risco: "Crime de desobediência + penhora", dependencia: "sistema" },
    ],
  },
  {
    id: "ferias", titulo: "Férias", emoji: "5️⃣",
    icon: <Palmtree className="h-5 w-5" />,
    items: [
      { id: "fe01", nome: "Controle de período aquisitivo", descricao: "12 meses de vigência do contrato = 1 período aquisitivo", baseLegal: "CLT Art. 130", risco: "Férias em dobro (Art. 137 CLT)", dependencia: "sistema" },
      { id: "fe02", nome: "Concessão dentro do período concessivo", descricao: "Conceder até 12 meses após o período aquisitivo", baseLegal: "CLT Art. 134", risco: "Pagamento em dobro + multa de R$ 170,26 por empregado", dependencia: "sistema" },
      { id: "fe03", nome: "Comunicação 30 dias antes", descricao: "Aviso por escrito com 30 dias de antecedência", baseLegal: "CLT Art. 135", risco: "Nulidade da concessão", dependencia: "procedimento" },
      { id: "fe04", nome: "Pagamento 2 dias antes do início", descricao: "Remuneração + 1/3 constitucional antecipados", baseLegal: "CLT Art. 145", risco: "Pagamento em dobro (Súmula 450 TST)", dependencia: "procedimento" },
      { id: "fe05", nome: "Adicional de 1/3 constitucional", descricao: "Terço constitucional obrigatório sobre férias", baseLegal: "CF Art. 7º, XVII", risco: "Diferenças + processo trabalhista", dependencia: "sistema" },
      { id: "fe06", nome: "Fracionamento de férias (até 3 períodos)", descricao: "Um período de no mínimo 14 dias, demais mínimo 5 dias", baseLegal: "CLT Art. 134 §1º", risco: "Nulidade do fracionamento", dependencia: "parcial" },
      { id: "fe07", nome: "Abono pecuniário (venda de férias)", descricao: "Conversão de até 1/3 das férias em abono, a pedido do empregado", baseLegal: "CLT Art. 143", risco: "Reclamação se imposto pelo empregador", dependencia: "parcial" },
      { id: "fe08", nome: "Férias coletivas — comunicação prévia", descricao: "Comunicar ao MTE e sindicato com 15 dias de antecedência", baseLegal: "CLT Art. 139", risco: "Nulidade das férias coletivas", dependencia: "procedimento" },
      { id: "fe09", nome: "Registro de férias no sistema", descricao: "Anotação correta no sistema e eSocial (S-2230)", baseLegal: "CLT; eSocial", risco: "Multa por omissão de evento", dependencia: "sistema" },
      { id: "fe10", nome: "Férias proporcionais na rescisão", descricao: "Cálculo proporcional ao tempo trabalhado", baseLegal: "CLT Art. 146-147", risco: "Diferenças rescisórias", dependencia: "sistema" },
      { id: "fe11", nome: "Proibição de férias a menor de 18 anos fora do escolar", descricao: "Menor tem direito a coincidir férias com período escolar", baseLegal: "CLT Art. 136 §2º", risco: "Reclamação trabalhista", dependencia: "procedimento" },
    ],
  },
  {
    id: "decimo", titulo: "13º Salário", emoji: "6️⃣",
    icon: <Gift className="h-5 w-5" />,
    items: [
      { id: "d01", nome: "1ª parcela até 30 de novembro", descricao: "Adiantamento de 50% do salário bruto", baseLegal: "Lei 4.749/65", risco: "Multa de R$ 170,26 por empregado", dependencia: "sistema" },
      { id: "d02", nome: "2ª parcela até 20 de dezembro", descricao: "Saldo com descontos de INSS e IRRF", baseLegal: "Lei 4.749/65", risco: "Multa + juros + correção", dependencia: "sistema" },
      { id: "d03", nome: "13º por ocasião das férias", descricao: "Adiantamento quando solicitado pelo empregado em janeiro", baseLegal: "Lei 4.749/65 Art. 2º §2º", risco: "Reclamação trabalhista", dependencia: "parcial" },
      { id: "d04", nome: "13º proporcional na rescisão", descricao: "Proporcional aos meses trabalhados no ano (regra dos 15 dias)", baseLegal: "Lei 4.090/62", risco: "Diferenças rescisórias", dependencia: "sistema" },
      { id: "d05", nome: "Desconto INSS sobre 13º", descricao: "Retenção correta na 2ª parcela", baseLegal: "Lei 8.212/91", risco: "Multa + apropriação indébita previdenciária", dependencia: "sistema" },
      { id: "d06", nome: "Desconto IRRF sobre 13º", descricao: "Tributação exclusiva na fonte na 2ª parcela", baseLegal: "RIR; IN RFB", risco: "Multa fiscal", dependencia: "sistema" },
      { id: "d07", nome: "FGTS sobre 13º", descricao: "8% sobre cada parcela", baseLegal: "Lei 8.036/90", risco: "Multa + juros FGTS", dependencia: "sistema" },
      { id: "d08", nome: "Reflexo de HE/comissões no 13º", descricao: "Médias de HE e comissões habituais integram 13º", baseLegal: "Súmula 45 TST", risco: "Diferenças salariais", dependencia: "sistema" },
    ],
  },
  {
    id: "beneficios", titulo: "Benefícios e Obrigações Acessórias", emoji: "7️⃣",
    icon: <Heart className="h-5 w-5" />,
    items: [
      { id: "b01", nome: "Vale-transporte — fornecimento", descricao: "Obrigatório quando solicitado pelo empregado", baseLegal: "Lei 7.418/85", risco: "Reclamação + indenização por deslocamento", dependencia: "parcial" },
      { id: "b02", nome: "Vale-transporte — desconto máx. 6%", descricao: "Limite de 6% sobre salário base", baseLegal: "Decreto 95.247/87", risco: "Desconto indevido + reclamação", dependencia: "sistema" },
      { id: "b03", nome: "Vale-alimentação/refeição", descricao: "Conforme CCT/ACT ou política interna", baseLegal: "PAT; Lei 14.442/22", risco: "Reclamação por habitualidade", dependencia: "procedimento" },
      { id: "b04", nome: "Plano de saúde — regras de desconto", descricao: "Desconto autorizado por escrito, manutenção em afastamento", baseLegal: "CLT; Lei 9.656/98", risco: "Reclamação + dano moral", dependencia: "procedimento" },
      { id: "b05", nome: "Plano de saúde — manutenção na rescisão", descricao: "Direito de manutenção por período proporcional (demissão sem justa causa)", baseLegal: "Lei 9.656/98 Art. 30-31", risco: "Ação judicial + dano moral", dependencia: "procedimento" },
      { id: "b06", nome: "Auxílio-creche", descricao: "Quando previsto em CCT/ACT ou lei", baseLegal: "CLT Art. 389 §1º", risco: "Multa + reclamação", dependencia: "procedimento" },
      { id: "b07", nome: "Cesta básica", descricao: "Conforme CCT/ACT", baseLegal: "Convenção coletiva", risco: "Multa sindical", dependencia: "procedimento" },
      { id: "b08", nome: "Seguro de vida em grupo", descricao: "Quando previsto em CCT/ACT", baseLegal: "Convenção coletiva", risco: "Multa sindical + ação dos beneficiários", dependencia: "procedimento" },
      { id: "b09", nome: "PLR — Participação nos lucros", descricao: "Acordo prévio com comissão de empregados ou sindicato", baseLegal: "Lei 10.101/2000", risco: "Descaracterização e integração ao salário", dependencia: "parcial" },
    ],
  },
  {
    id: "sst", titulo: "Segurança do Trabalho (NRs)", emoji: "8️⃣",
    icon: <HardHat className="h-5 w-5" />,
    items: [
      { id: "s01", nome: "PGR — Programa de Gerenciamento de Riscos", descricao: "Identificação, avaliação e controle de riscos ocupacionais", baseLegal: "NR-1", risco: "Multa de R$ 2.396 a R$ 6.708 + embargo", dependencia: "procedimento" },
      { id: "s02", nome: "PCMSO — Programa de Saúde Ocupacional", descricao: "Monitoramento da saúde dos trabalhadores", baseLegal: "NR-7", risco: "Multa de R$ 1.436 a R$ 4.024", dependencia: "procedimento" },
      { id: "s03", nome: "Exame periódico", descricao: "Exames conforme periodicidade do PCMSO", baseLegal: "NR-7 item 7.5.8", risco: "Multa NR-7 + responsabilidade por doença ocupacional", dependencia: "procedimento" },
      { id: "s04", nome: "Exame de retorno ao trabalho", descricao: "ASO de retorno após afastamento ≥ 30 dias", baseLegal: "NR-7 item 7.5.9", risco: "Multa + responsabilidade", dependencia: "procedimento" },
      { id: "s05", nome: "Exame de mudança de função", descricao: "ASO quando há alteração de risco ocupacional", baseLegal: "NR-7 item 7.5.10", risco: "Multa NR-7", dependencia: "procedimento" },
      { id: "s06", nome: "Exame demissional", descricao: "ASO até a data da homologação", baseLegal: "NR-7 item 7.5.11", risco: "Multa + ação por doença oculta", dependencia: "procedimento" },
      { id: "s07", nome: "Fornecimento de EPI", descricao: "EPI adequado ao risco, gratuito, em perfeito estado", baseLegal: "NR-6; CLT Art. 166", risco: "Multa NR-6 de R$ 2.396 a R$ 6.708", dependencia: "procedimento" },
      { id: "s08", nome: "Ficha de entrega de EPI assinada", descricao: "Registro formal de entrega com assinatura do empregado", baseLegal: "NR-6 item 6.6.1", risco: "Responsabilidade integral em acidentes", dependencia: "parcial" },
      { id: "s09", nome: "Treinamentos NR obrigatórios", descricao: "NR-5 (CIPA), NR-6 (EPI), NR-10, NR-12, NR-35 etc.", baseLegal: "NRs específicas", risco: "Multa por NR + interdição de atividades", dependencia: "procedimento" },
      { id: "s10", nome: "Reciclagem de treinamentos", descricao: "Renovação periódica conforme cada NR", baseLegal: "NRs específicas", risco: "Multa + invalidade do treinamento anterior", dependencia: "parcial" },
      { id: "s11", nome: "CIPA — Constituição e eleição", descricao: "Conforme dimensionamento (NR-5)", baseLegal: "NR-5; CLT Art. 163-165", risco: "Multa NR-5 + estabilidade não respeitada", dependencia: "procedimento" },
      { id: "s12", nome: "CIPA — Reuniões mensais", descricao: "Atas de reuniões ordinárias mensais", baseLegal: "NR-5", risco: "Multa por descumprimento", dependencia: "procedimento" },
      { id: "s13", nome: "Emissão de CAT", descricao: "Comunicação de Acidente de Trabalho ao INSS em até 1 dia útil", baseLegal: "Lei 8.213/91 Art. 22; CLT Art. 169", risco: "Multa variável + responsabilidade criminal", dependencia: "parcial" },
      { id: "s14", nome: "Mapa de riscos", descricao: "Elaboração e afixação em locais visíveis", baseLegal: "NR-5", risco: "Multa + citação em perícia", dependencia: "procedimento" },
      { id: "s15", nome: "LTCAT — Laudo Técnico", descricao: "Laudo de condições ambientais do trabalho", baseLegal: "Lei 8.213/91 Art. 58", risco: "Multa INSS + impossibilidade de aposentadoria especial", dependencia: "procedimento" },
      { id: "s16", nome: "PPP — Perfil Profissiográfico", descricao: "Documento obrigatório para todos os empregados", baseLegal: "Lei 8.213/91; IN INSS 128", risco: "Multa INSS + bloqueio de benefícios", dependencia: "parcial" },
    ],
  },
  {
    id: "rescisao", titulo: "Rescisão de Contrato", emoji: "9️⃣",
    icon: <FileX className="h-5 w-5" />,
    items: [
      { id: "r01", nome: "Prazo de pagamento (10 dias)", descricao: "Verbas rescisórias pagas em até 10 dias corridos do término", baseLegal: "CLT Art. 477 §6º", risco: "Multa = salário do empregado (Art. 477 §8º)", dependencia: "sistema" },
      { id: "r02", nome: "Cálculo correto de verbas rescisórias", descricao: "Saldo salário, férias prop. +1/3, 13º prop., aviso prévio", baseLegal: "CLT Art. 477", risco: "Diferenças rescisórias + processo", dependencia: "sistema" },
      { id: "r03", nome: "Multa FGTS 40%", descricao: "Depósito de 40% sobre saldo FGTS (sem justa causa)", baseLegal: "Lei 8.036/90 Art. 18", risco: "Ação trabalhista + multa", dependencia: "sistema" },
      { id: "r04", nome: "Multa FGTS 20% (acordo mútuo)", descricao: "Depósito de 20% em rescisão por acordo (Art. 484-A)", baseLegal: "CLT Art. 484-A", risco: "Diferenças + reclamação", dependencia: "sistema" },
      { id: "r05", nome: "TRCT — Termo de Rescisão", descricao: "Documento rescisório detalhado e assinado", baseLegal: "CLT Art. 477", risco: "Nulidade da rescisão", dependencia: "sistema" },
      { id: "r06", nome: "Aviso prévio proporcional", descricao: "30 dias + 3 dias por ano trabalhado (máx. 90 dias)", baseLegal: "Lei 12.506/2011", risco: "Pagamento do período não concedido", dependencia: "sistema" },
      { id: "r07", nome: "Redução de jornada no aviso trabalhado", descricao: "2h/dia ou 7 dias corridos de folga", baseLegal: "CLT Art. 488", risco: "Nulidade do aviso + pagamento", dependencia: "procedimento" },
      { id: "r08", nome: "Exame demissional", descricao: "ASO demissional obrigatório", baseLegal: "NR-7", risco: "Multa NR-7 + ação por doença oculta", dependencia: "procedimento" },
      { id: "r09", nome: "Baixa no eSocial (S-2299)", descricao: "Envio do evento de desligamento", baseLegal: "eSocial S-2299", risco: "Multa por omissão de evento", dependencia: "sistema" },
      { id: "r10", nome: "Entrega de documentos ao empregado", descricao: "TRCT, guias FGTS/seguro-desemprego, PPP", baseLegal: "CLT Art. 477", risco: "Reclamação + multa", dependencia: "procedimento" },
      { id: "r11", nome: "Liberação de chaves FGTS", descricao: "Comunicação à Caixa para saque", baseLegal: "Lei 8.036/90", risco: "Ação judicial do empregado", dependencia: "sistema" },
      { id: "r12", nome: "Guia de seguro-desemprego", descricao: "Emissão para demissão sem justa causa", baseLegal: "Lei 7.998/90", risco: "Reclamação + indenização", dependencia: "sistema" },
      { id: "r13", nome: "Estabilidades — verificação prévia", descricao: "Gestante, cipeiro, acidentado, dirigente sindical", baseLegal: "CLT Art. 10 ADCT; NR-5; Art. 118 Lei 8.213", risco: "Reintegração + salários do período + dano moral", dependencia: "parcial" },
    ],
  },
  {
    id: "lgpd", titulo: "LGPD – Dados de Funcionários", emoji: "🔟",
    icon: <ShieldAlert className="h-5 w-5" />,
    items: [
      { id: "l01", nome: "Base legal para tratamento de dados", descricao: "Identificar base legal (execução de contrato, obrigação legal)", baseLegal: "LGPD Art. 7º", risco: "Multa até 2% do faturamento (máx. R$ 50 milhões)", dependencia: "parcial" },
      { id: "l02", nome: "Armazenamento seguro de dados pessoais", descricao: "Criptografia, backups, controle de acesso", baseLegal: "LGPD Art. 46", risco: "Multa ANPD + dano moral coletivo", dependencia: "parcial" },
      { id: "l03", nome: "Acesso restrito a dados de RH", descricao: "Controle de perfis e permissões por função", baseLegal: "LGPD Art. 46-47", risco: "Vazamento + multa + dano moral", dependencia: "parcial" },
      { id: "l04", nome: "Política de privacidade interna", descricao: "Documento informando tratamento de dados dos empregados", baseLegal: "LGPD Art. 9º", risco: "Multa ANPD", dependencia: "procedimento" },
      { id: "l05", nome: "Termo de consentimento (quando aplicável)", descricao: "Consentimento livre para dados não obrigatórios (ex: biometria)", baseLegal: "LGPD Art. 8º", risco: "Nulidade do tratamento + multa", dependencia: "procedimento" },
      { id: "l06", nome: "Direito de acesso do titular", descricao: "Empregado pode solicitar acesso aos seus dados", baseLegal: "LGPD Art. 18", risco: "Multa + ação judicial", dependencia: "parcial" },
      { id: "l07", nome: "Retenção e descarte de dados", descricao: "Política de retenção após rescisão (prazos legais de guarda)", baseLegal: "LGPD Art. 15-16", risco: "Multa por retenção indevida ou descarte prematuro", dependencia: "parcial" },
      { id: "l08", nome: "Compartilhamento com terceiros", descricao: "Contrato com operadores (contabilidade, plano saúde, etc.)", baseLegal: "LGPD Art. 39", risco: "Responsabilidade solidária", dependencia: "procedimento" },
      { id: "l09", nome: "Relatório de Impacto (RIPD)", descricao: "Avaliação de riscos para dados sensíveis de empregados", baseLegal: "LGPD Art. 38", risco: "Multa ANPD + medida corretiva", dependencia: "procedimento" },
      { id: "l10", nome: "Encarregado de dados (DPO)", descricao: "Designação de responsável pelo tratamento de dados", baseLegal: "LGPD Art. 41", risco: "Multa por ausência de DPO", dependencia: "procedimento" },
    ],
  },
];

const STORAGE_KEY = "checklist-trabalhista-v3";

const DEP_CONFIG: Record<Dependencia, { label: string; color: string; emoji: string }> = {
  sistema: { label: "Sistema", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", emoji: "🟦" },
  parcial: { label: "Parcial", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", emoji: "🟨" },
  procedimento: { label: "Procedimento", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", emoji: "🟥" },
};

const AUDIT_CONFIG: Record<AuditoriaStatus, { label: string; color: string; emoji: string }> = {
  pendente: { label: "Pendente", color: "bg-muted text-muted-foreground", emoji: "⬜" },
  conforme: { label: "Conforme", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", emoji: "✅" },
  nao_conforme: { label: "Não conforme", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", emoji: "❌" },
  nao_aplicavel: { label: "N/A", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", emoji: "➖" },
};

const ChecklistTrabalhista = () => {
  const [auditoriaMap, setAuditoriaMap] = useState<Record<string, AuditoriaStatus>>({});
  const [busca, setBusca] = useState("");
  const [filtroDepend, setFiltroDepend] = useState<string>("todos");
  const [filtroAudit, setFiltroAudit] = useState<string>("todos");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORIAS.map(c => [c.id, true]))
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAuditoriaMap(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const setAuditoria = (id: string, status: AuditoriaStatus) => {
    setAuditoriaMap(prev => {
      const next = { ...prev, [id]: status };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allItems = useMemo(() => CATEGORIAS.flatMap(c => c.items), []);
  const totalItems = allItems.length;

  const stats = useMemo(() => {
    const conforme = allItems.filter(i => auditoriaMap[i.id] === "conforme").length;
    const naoConforme = allItems.filter(i => auditoriaMap[i.id] === "nao_conforme").length;
    const na = allItems.filter(i => auditoriaMap[i.id] === "nao_aplicavel").length;
    const pendente = totalItems - conforme - naoConforme - na;
    const pct = totalItems ? Math.round(((conforme + na) / totalItems) * 100) : 0;
    const sistema = allItems.filter(i => i.dependencia === "sistema").length;
    const parcial = allItems.filter(i => i.dependencia === "parcial").length;
    const procedimento = allItems.filter(i => i.dependencia === "procedimento").length;
    return { conforme, naoConforme, na, pendente, pct, sistema, parcial, procedimento };
  }, [allItems, auditoriaMap, totalItems]);

  const filterItems = (items: CheckItem[]) => {
    return items.filter(item => {
      const q = busca.toLowerCase();
      const matchBusca = !q || item.nome.toLowerCase().includes(q) || item.descricao.toLowerCase().includes(q) || item.baseLegal.toLowerCase().includes(q) || item.risco.toLowerCase().includes(q);
      const matchDep = filtroDepend === "todos" || item.dependencia === filtroDepend;
      const status = auditoriaMap[item.id] || "pendente";
      const matchAudit = filtroAudit === "todos" || status === filtroAudit;
      return matchBusca && matchDep && matchAudit;
    });
  };

  const exportCSV = () => {
    const rows = [
      ["Categoria", "Item", "Descrição", "Base Legal", "Risco", "Dependência", "Auditoria"],
      ...CATEGORIAS.flatMap(cat =>
        cat.items.map(i => [
          cat.titulo, i.nome, i.descricao, i.baseLegal, i.risco,
          DEP_CONFIG[i.dependencia].label,
          AUDIT_CONFIG[auditoriaMap[i.id] || "pendente"].label,
        ])
      ),
    ];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-trabalhista-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const expandAll = () => setOpenSections(Object.fromEntries(CATEGORIAS.map(c => [c.id, true])));
  const collapseAll = () => setOpenSections(Object.fromEntries(CATEGORIAS.map(c => [c.id, false])));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton to="/gestao-rh" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <ShieldCheck className="h-6 w-6 text-primary" />
                Checklist de Auditoria Trabalhista
              </h1>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                {totalItems} pontos de verificação • CLT, eSocial, FGTS, INSS, NRs e LGPD
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>

        {/* Progress + Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progresso da Auditoria</p>
                <p className="text-2xl font-bold text-foreground">{stats.conforme + stats.na}/{totalItems} itens resolvidos</p>
              </div>
              <div className="text-3xl font-bold text-primary">{stats.pct}%</div>
            </div>
            <Progress value={stats.pct} className="h-3 mb-4" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{stats.conforme}</p>
                <p className="text-xs text-muted-foreground">Conforme</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{stats.naoConforme}</p>
                <p className="text-xs text-muted-foreground">Não conforme</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-muted-foreground">{stats.na}</p>
                <p className="text-xs text-muted-foreground">N/A</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.pendente}</p>
                <p className="text-xs text-muted-foreground">Pendente</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500" /> 🟦 Sistema ({stats.sistema})</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-amber-500" /> 🟨 Parcial ({stats.parcial})</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> 🟥 Procedimento ({stats.procedimento})</span>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar item, legislação ou risco..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-10" />
          </div>
          <Select value={filtroDepend} onValueChange={setFiltroDepend}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Dependência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas dependências</SelectItem>
              <SelectItem value="sistema">🟦 Sistema</SelectItem>
              <SelectItem value="parcial">🟨 Parcial</SelectItem>
              <SelectItem value="procedimento">🟥 Procedimento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroAudit} onValueChange={setFiltroAudit}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Auditoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="pendente">⬜ Pendente</SelectItem>
              <SelectItem value="conforme">✅ Conforme</SelectItem>
              <SelectItem value="nao_conforme">❌ Não conforme</SelectItem>
              <SelectItem value="nao_aplicavel">➖ N/A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expand/Collapse all */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs">Expandir tudo</Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs">Recolher tudo</Button>
        </div>

        {/* Categories */}
        {CATEGORIAS.map(cat => {
          const filtered = filterItems(cat.items);
          if (filtered.length === 0 && (busca || filtroDepend !== "todos" || filtroAudit !== "todos")) return null;
          const catConforme = cat.items.filter(i => auditoriaMap[i.id] === "conforme" || auditoriaMap[i.id] === "nao_aplicavel").length;
          const catPct = cat.items.length ? Math.round((catConforme / cat.items.length) * 100) : 0;

          return (
            <Collapsible key={cat.id} open={openSections[cat.id]} onOpenChange={() => toggleSection(cat.id)}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                        {openSections[cat.id] ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        <span className="text-primary">{cat.icon}</span>
                        <span>{cat.emoji} {cat.titulo}</span>
                        <Badge variant="secondary" className="text-[10px] ml-1">{cat.items.length}</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground hidden sm:inline">{catConforme}/{cat.items.length}</span>
                        <Badge variant="outline" className="text-xs">{catPct}%</Badge>
                      </div>
                    </div>
                    <Progress value={catPct} className="h-1.5 mt-2" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="hidden md:table-cell">Descrição</TableHead>
                          <TableHead className="hidden sm:table-cell w-28">Base Legal</TableHead>
                          <TableHead className="hidden lg:table-cell">Risco</TableHead>
                          <TableHead className="w-28">Tipo</TableHead>
                          <TableHead className="w-36">Auditoria</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(item => {
                          const dep = DEP_CONFIG[item.dependencia];
                          const status = auditoriaMap[item.id] || "pendente";
                          const rowBg = status === "conforme"
                            ? "bg-green-50/50 dark:bg-green-950/10"
                            : status === "nao_conforme"
                            ? "bg-red-50/50 dark:bg-red-950/10"
                            : "";

                          return (
                            <TableRow key={item.id} className={rowBg}>
                              <TableCell className="font-medium text-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                                {item.nome}
                                <p className="md:hidden text-xs text-muted-foreground mt-0.5">{item.descricao}</p>
                                <p className="sm:hidden text-xs text-muted-foreground font-mono">{item.baseLegal}</p>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.descricao}</TableCell>
                              <TableCell className="hidden sm:table-cell text-xs font-mono text-muted-foreground">{item.baseLegal}</TableCell>
                              <TableCell className="hidden lg:table-cell text-xs text-destructive">{item.risco}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] ${dep.color}`}>
                                  {dep.emoji} {dep.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Select value={status} onValueChange={(v) => setAuditoria(item.id, v as AuditoriaStatus)}>
                                  <SelectTrigger className="h-7 text-xs w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pendente">⬜ Pendente</SelectItem>
                                    <SelectItem value="conforme">✅ Conforme</SelectItem>
                                    <SelectItem value="nao_conforme">❌ Não conforme</SelectItem>
                                    <SelectItem value="nao_aplicavel">➖ N/A</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filtered.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                              Nenhum item encontrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {/* Footer */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <div className="space-y-1">
                <p className="font-medium text-foreground">✔ {totalItems} pontos de verificação</p>
                <p>Auditoria de RH • Compliance trabalhista • Departamento pessoal • Prevenção de processos</p>
              </div>
              <p>Status salvo automaticamente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChecklistTrabalhista;
