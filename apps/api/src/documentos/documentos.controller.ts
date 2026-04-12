import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { CriarDocumentoDto } from './dto/criar-documento.dto';
import { AnexarArquivoDto } from './dto/anexar-arquivo.dto';

@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get()
  listar(
    @Query('unidadeId') unidadeId?: string,
    @Query('contratoId') contratoId?: string,
    @Query('status') status?: string,
  ) {
    return this.documentosService.listar(unidadeId, contratoId, status);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.documentosService.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CriarDocumentoDto) {
    return this.documentosService.criar(dto);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: Partial<CriarDocumentoDto>) {
    return this.documentosService.atualizar(id, dto);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.documentosService.excluir(id);
  }

  @Post(':id/arquivos')
  anexarArquivo(@Param('id') id: string, @Body() dto: AnexarArquivoDto) {
    return this.documentosService.anexarArquivo(id, dto);
  }

  @Delete(':id/arquivos/:arquivoId')
  excluirArquivo(
    @Param('id') id: string,
    @Param('arquivoId') arquivoId: string,
  ) {
    return this.documentosService.excluirArquivo(id, arquivoId);
  }
}