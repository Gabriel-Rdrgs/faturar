import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { CriarUnidadeDto } from './dto/criar-unidade.dto';

@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  @Get()
  listar() {
    return this.unidadesService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.unidadesService.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CriarUnidadeDto) {
    return this.unidadesService.criar(dto);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: Partial<CriarUnidadeDto>) {
    return this.unidadesService.atualizar(id, dto);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.unidadesService.excluir(id);
  }
}