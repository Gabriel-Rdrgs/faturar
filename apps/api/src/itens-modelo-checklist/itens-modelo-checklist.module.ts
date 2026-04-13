import { Module } from '@nestjs/common';
import { ItensModeloChecklistController } from './itens-modelo-checklist.controller';
import { ItensModeloChecklistService } from './itens-modelo-checklist.service';

@Module({
  controllers: [ItensModeloChecklistController],
  providers: [ItensModeloChecklistService],
  exports: [ItensModeloChecklistService],
})
export class ItensModeloChecklistModule {}