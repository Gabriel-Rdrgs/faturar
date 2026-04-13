import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { PapeisGuard } from '../auth/papeis.guard';
import { Papeis } from '../auth/papeis.decorator';
import { PapelUsuario } from '@prisma/client';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Qualquer autenticado pode ver seus próprios dados
  @Get('me')
  buscarMe(@Req() req: any) {
    const supabaseId = req.user?.id;
    return this.usuariosService.buscarPorSupabaseId(supabaseId);
  }

  // Somente admins e gestores globais listam usuários
  @UseGuards(PapeisGuard)
  @Papeis(PapelUsuario.ADMIN_GLOBAL, PapelUsuario.GESTOR_GLOBAL)
  @Get()
  listar() {
    return this.usuariosService.listar();
  }

  // Somente admins e gestores globais buscam usuário por ID
  @UseGuards(PapeisGuard)
  @Papeis(PapelUsuario.ADMIN_GLOBAL, PapelUsuario.GESTOR_GLOBAL)
  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.usuariosService.buscarPorId(id);
  }

  // Somente admin global cria usuários
  @UseGuards(PapeisGuard)
  @Papeis(PapelUsuario.ADMIN_GLOBAL)
  @Post()
  criar(@Body() dto: any) {
    return this.usuariosService.criar(dto);
  }

  // Admins e gestores globais editam usuários
  @UseGuards(PapeisGuard)
  @Papeis(PapelUsuario.ADMIN_GLOBAL, PapelUsuario.GESTOR_GLOBAL)
  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: any) {
    return this.usuariosService.atualizar(id, dto);
  }

  // Somente admin global exclui usuários
  @UseGuards(PapeisGuard)
  @Papeis(PapelUsuario.ADMIN_GLOBAL)
  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.usuariosService.excluir(id);
  }

  // Admins e gestores globais reenviam convite
  @UseGuards(PapeisGuard)
  @Papeis(PapelUsuario.ADMIN_GLOBAL, PapelUsuario.GESTOR_GLOBAL)
  @Post(':id/reenviar-convite')
  reenviarConvite(@Param('id') id: string) {
    return this.usuariosService.reenviarConvite(id);
  }
}