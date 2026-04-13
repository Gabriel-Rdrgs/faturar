import { Module } from '@nestjs/common';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { AlertasDocumentoModule } from '../alertas-documento/alertas-documento.module';
import { ChecklistsUnidadeModule } from '../checklists-unidade/checklists-unidade.module';

@Module({
  imports: [AlertasDocumentoModule, ChecklistsUnidadeModule],
  controllers: [DocumentosController],
  providers: [DocumentosService],
})
export class DocumentosModule {}