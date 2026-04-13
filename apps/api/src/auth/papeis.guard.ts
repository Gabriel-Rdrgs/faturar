import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PapelUsuario } from '@prisma/client';
import { PAPEIS_KEY } from './papeis.decorator';

@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lê quais papéis a rota exige
    const papeisExigidos = this.reflector.getAllAndOverride<PapelUsuario[]>(
      PAPEIS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se a rota não tem @Papeis(), qualquer autenticado pode acessar
    if (!papeisExigidos || papeisExigidos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const supabaseUser = request.user;

    if (!supabaseUser?.id) {
      throw new ForbiddenException('Usuário não identificado');
    }

    // Busca o papel do usuário no banco interno
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: supabaseUser.id },
      select: { papel: true, ativo: true },
    });

    if (!usuario) {
      throw new ForbiddenException('Usuário não encontrado no sistema');
    }

    if (!usuario.ativo) {
      throw new ForbiddenException('Usuário inativo');
    }

    // Verifica se o papel do usuário está na lista de papéis permitidos
    if (!papeisExigidos.includes(usuario.papel)) {
      throw new ForbiddenException(
        'Você não tem permissão para realizar esta ação',
      );
    }

    // Injeta o papel no request para uso futuro sem nova consulta ao banco
    request.usuarioPapel = usuario.papel;
    return true;
  }
}