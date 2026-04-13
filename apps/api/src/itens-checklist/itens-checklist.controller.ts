import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ItensChecklistService } from './itens-checklist.service';

@Controller('itens-checklist')
export class ItensChecklistController {
  constructor(private readonly service: ItensChecklistService) {}

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: any) {
    return this.service.atualizar(id, dto);
  }
}