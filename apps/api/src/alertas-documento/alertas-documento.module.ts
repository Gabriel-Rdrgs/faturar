import { Module } from '@nestjs/common';
import { AlertasDocumentoController } from './alertas-documento.controller';
import { AlertasDocumentoService } from './alertas-documento.service';

@Module({
  controllers: [AlertasDocumentoController],
  providers: [AlertasDocumentoService],
  exports: [AlertasDocumentoService],
})
export class AlertasDocumentoModule {}