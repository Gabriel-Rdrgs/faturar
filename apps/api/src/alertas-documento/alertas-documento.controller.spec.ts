import { Test, TestingModule } from '@nestjs/testing';
import { AlertasDocumentoController } from './alertas-documento.controller';

describe('AlertasDocumentoController', () => {
  let controller: AlertasDocumentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertasDocumentoController],
    }).compile();

    controller = module.get<AlertasDocumentoController>(AlertasDocumentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
