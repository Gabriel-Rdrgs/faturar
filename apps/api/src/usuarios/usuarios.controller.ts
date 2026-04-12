import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsuariosService, CriarUsuarioDto } from './usuarios.service';
import { Public } from '../auth/public.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  listar() {
    return this.usuariosService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.usuariosService.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CriarUsuarioDto) {
    return this.usuariosService.criar(dto);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: Partial<CriarUsuarioDto>) {
    return this.usuariosService.atualizar(id, dto);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.usuariosService.excluir(id);
  }

  @Public()
  @Post(':id/reenviar-convite')
  reenviarConvite(@Param('id') id: string) {
    return this.usuariosService.reenviarConvite(id);
  }
}