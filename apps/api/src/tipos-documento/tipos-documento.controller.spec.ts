import { Test, TestingModule } from '@nestjs/testing';
import { TiposDocumentoController } from './tipos-documento.controller';

describe('TiposDocumentoController', () => {
  let controller: TiposDocumentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposDocumentoController],
    }).compile();

    controller = module.get<TiposDocumentoController>(TiposDocumentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
