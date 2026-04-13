import { Module } from '@nestjs/common';
import { ChecklistsUnidadeController } from './checklists-unidade.controller';
import { ChecklistsUnidadeService } from './checklists-unidade.service';

@Module({
  controllers: [ChecklistsUnidadeController],
  providers: [ChecklistsUnidadeService],
  exports: [ChecklistsUnidadeService],
})
export class ChecklistsUnidadeModule {}