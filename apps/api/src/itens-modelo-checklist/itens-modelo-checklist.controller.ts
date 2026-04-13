import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ItensModeloChecklistService } from './itens-modelo-checklist.service';

@Controller('itens-modelo-checklist')
export class ItensModeloChecklistController {
  constructor(private readonly service: ItensModeloChecklistService) {}

  @Post()
  criar(@Body() dto: any) {
    return this.service.criar(dto.modeloId, dto);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: any) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.service.excluir(id);
  }
}