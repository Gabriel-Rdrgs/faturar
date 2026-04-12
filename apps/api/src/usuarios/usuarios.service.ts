import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

export class CriarUsuarioDto {
  nome: string;
  email: string;
  papel: string;
  unidadeId?: string;
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

  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        criadoEm: true,
        unidade: { select: { id: true, nome: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        criadoEm: true,
        unidade: { select: { id: true, nome: true } },
      },
    });
  }

  async criar(dto: CriarUsuarioDto) {
    // 1. Cria o usuário no Supabase Auth e envia e-mail de convite
    const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.inviteUserByEmail(
      dto.email,
      {
        redirectTo: 'http://localhost:3000/auth/callback',
        data: {
          nome: dto.nome,
          papel: dto.papel,
        },
      },
    );

    if (authError) {
      throw new BadRequestException(
        `Erro ao criar conta de acesso: ${authError.message}`,
      );
    }

    // 2. Cria o registro interno na tabela usuarios
    return this.prisma.usuario.create({
      data: {
        id: authData.user.id, // usa o mesmo ID do Supabase Auth
        nome: dto.nome,
        email: dto.email,
        senhaHash: 'managed-by-supabase',
        papel: dto.papel as any,
        unidadeId: dto.unidadeId || null,
        ativo: dto.ativo ?? true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        criadoEm: true,
        unidade: { select: { id: true, nome: true } },
      },
    });
  }

  async atualizar(id: string, dto: Partial<CriarUsuarioDto>) {
    // Atualiza metadados no Supabase Auth se necessário
    if (dto.email || dto.nome) {
      await this.supabaseAdmin.auth.admin.updateUserById(id, {
        email: dto.email,
        user_metadata: {
          nome: dto.nome,
          papel: dto.papel,
        },
      });
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        nome: dto.nome,
        email: dto.email,
        papel: dto.papel as any,
        unidadeId: dto.unidadeId ?? undefined,
        ativo: dto.ativo,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        criadoEm: true,
        unidade: { select: { id: true, nome: true } },
      },
    });
  }

  async excluir(id: string) {
    // Remove do Supabase Auth
    await this.supabaseAdmin.auth.admin.deleteUser(id);

    // Remove do banco interno
    return this.prisma.usuario.delete({ where: { id } });
  }
  async reenviarConvite(id: string) {
  const usuario = await this.prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new BadRequestException('Usuário não encontrado');

  const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: usuario.email,
    options: {
      redirectTo: 'http://localhost:3000/auth/callback',
    },
  });

  if (error) throw new BadRequestException(error.message);

  return { link: data.properties.action_link };
}
}