import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { TiposDocumentoService } from './tipos-documento.service';
import { CriarTipoDocumentoDto } from './dto/criar-tipo-documento.dto';


@Controller('tipos-documento')
export class TiposDocumentoController {
  constructor(private readonly tiposDocumentoService: TiposDocumentoService) {}

  @Get()
  listar(@Query('categoria') categoria?: string) {
    return this.tiposDocumentoService.listar(categoria);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.tiposDocumentoService.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CriarTipoDocumentoDto) {
    return this.tiposDocumentoService.criar(dto);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: Partial<CriarTipoDocumentoDto>) {
    return this.tiposDocumentoService.atualizar(id, dto);
  }
  @Delete(':id')
excluir(@Param('id') id: string) {
  return this.tiposDocumentoService.excluir(id);
}
}
