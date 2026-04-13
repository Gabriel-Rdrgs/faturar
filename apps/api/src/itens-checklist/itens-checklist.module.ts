import { Module } from '@nestjs/common';
import { ItensChecklistController } from './itens-checklist.controller';
import { ItensChecklistService } from './itens-checklist.service';

@Module({
  controllers: [ItensChecklistController],
  providers: [ItensChecklistService],
  exports: [ItensChecklistService],
})
export class ItensChecklistModule {}