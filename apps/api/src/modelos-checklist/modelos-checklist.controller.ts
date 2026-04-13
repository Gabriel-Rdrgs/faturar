import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ModelosChecklistService } from './modelos-checklist.service';

@Controller('modelos-checklist')
export class ModelosChecklistController {
  constructor(private readonly service: ModelosChecklistService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: any) {
    return this.service.criar(dto);
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