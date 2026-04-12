import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ContratosService } from './contratos.service';
import { CriarContratoDto } from './dto/criar-contrato.dto';

@Controller('contratos')
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Get()
  listar(@Query('unidadeId') unidadeId?: string) {
    return this.contratosService.listar(unidadeId);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.contratosService.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CriarContratoDto) {
    return this.contratosService.criar(dto);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: Partial<CriarContratoDto>) {
    return this.contratosService.atualizar(id, dto);
  }
  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.contratosService.excluir(id);
  }
}