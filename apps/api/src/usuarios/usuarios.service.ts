import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';
import { PapelUsuario } from '@prisma/client';

interface CriarUsuarioDto {
  nome: string;
  email: string;
  papel: string;
  unidadeId?: string | null;
  ativo?: boolean;
}

@Injectable()
export class UsuariosService {
  private supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  constructor(private prisma: PrismaService) {}

  // LISTAR TODOS
  async listar() {
    return this.prisma.usuario.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  // BUSCAR POR ID
  async buscarPorId(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  // BUSCAR USUÁRIO LOGADO (pelo ID do Supabase Auth)
  async buscarPorSupabaseId(supabaseId: string) {
    if (!supabaseId) {
      throw new NotFoundException('Usuário não identificado');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: supabaseId },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        unidadeId: true,
        unidade: { select: { id: true, nome: true } },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado no sistema');
    }

    return usuario;
  }

  // CRIAR (fluxo novo com Supabase Auth + generateLink)
  async criar(dto: CriarUsuarioDto) {
    const { data: authData, error: authError } =
      await this.supabaseAdmin.auth.admin.createUser({
        email: dto.email,
        password: 'Faturar@2026',
        email_confirm: true,
      });

    if (authError || !authData?.user) {
      throw new BadRequestException(
        authError?.message || 'Erro ao criar usuário no Supabase Auth',
      );
    }

    const { data: linkData, error: linkError } =
      await this.supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: dto.email,
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });

    if (linkError) {
      throw new BadRequestException(
        `Usuário criado no Supabase, mas falha ao gerar link de acesso: ${linkError.message}`,
      );
    }

    await this.prisma.usuario.create({
      data: {
        id: authData.user.id,
        nome: dto.nome,
        email: dto.email,
        senhaHash: '',
        papel: dto.papel as PapelUsuario,
        unidadeId: dto.unidadeId || null,
        ativo: dto.ativo ?? true,
      },
    });

    return {
      mensagem:
        'Usuário criado. Envie o link abaixo para o usuário definir a senha.',
      linkAcesso: linkData?.properties?.action_link,
    };
  }

  // ATUALIZAR (dados básicos; não mexe em Supabase Auth)
  async atualizar(id: string, dto: Partial<CriarUsuarioDto>) {
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuarioExistente) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        nome: dto.nome ?? usuarioExistente.nome,
        email: dto.email ?? usuarioExistente.email,
        papel:
          (dto.papel as PapelUsuario | undefined) ?? usuarioExistente.papel,
        unidadeId:
          dto.unidadeId !== undefined
            ? dto.unidadeId
            : usuarioExistente.unidadeId,
        ativo: dto.ativo ?? usuarioExistente.ativo,
      },
    });
  }

  // REENVIAR CONVITE (gera novo link de recovery)
  async reenviarConvite(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { data, error } =
      await this.supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: usuario.email,
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });

    if (error) {
      throw new BadRequestException(
        `Falha ao gerar link de acesso: ${error.message}`,
      );
    }

    return {
      mensagem: 'Link gerado com sucesso.',
      linkAcesso: data?.properties?.action_link,
    };
  }

  // EXCLUIR (Supabase Auth + banco interno)
  async excluir(id: string) {
    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      throw new BadRequestException(
        `Erro ao excluir usuário no Supabase Auth: ${error.message}`,
      );
    }

    return this.prisma.usuario.delete({ where: { id } });
  }
}