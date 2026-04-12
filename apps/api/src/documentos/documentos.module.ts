import { Module } from '@nestjs/common';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { AlertasDocumentoModule } from '../alertas-documento/alertas-documento.module';

@Module({
  imports: [AlertasDocumentoModule],
  controllers: [DocumentosController],
  providers: [DocumentosService],
})
export class DocumentosModule {}