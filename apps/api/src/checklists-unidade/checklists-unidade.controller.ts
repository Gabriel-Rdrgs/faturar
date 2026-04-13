import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ChecklistsUnidadeService } from './checklists-unidade.service';

@Controller('checklists-unidade')
export class ChecklistsUnidadeController {
  constructor(private readonly service: ChecklistsUnidadeService) {}

  @Get()
  listar(
    @Query('unidadeId') unidadeId?: string,
    @Query('modeloId') modeloId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listar(unidadeId, modeloId, status);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }

  @Post('gerar')
  gerar(@Body() dto: { modeloId: string; unidadeId: string }) {
    return this.service.gerar(dto);
  }

  @Post(':id/recalcular')
  recalcular(@Param('id') id: string) {
    return this.service.recalcular(id);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.service.excluir(id);
  }
}