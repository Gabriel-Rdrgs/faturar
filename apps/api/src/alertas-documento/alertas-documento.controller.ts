import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AlertasDocumentoService } from './alertas-documento.service';
import { Public } from '../auth/public.decorator';

@Controller('alertas-documento')
export class AlertasDocumentoController {
  constructor(private readonly alertasDocumentoService: AlertasDocumentoService) {}

  @Get()
  listar(
    @Query('unidadeId') unidadeId?: string,
    @Query('lido') lido?: string,
  ) {
    return this.alertasDocumentoService.listar(unidadeId, lido);
  }

  @Patch(':id/marcar-como-lido')
  marcarComoLido(@Param('id') id: string) {
    return this.alertasDocumentoService.marcarComoLido(id);
  }

  @Public()
  @Post('verificar-todos')
  verificarTodos() {
    return this.alertasDocumentoService.verificarTodos();
  }
}