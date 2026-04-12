import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { UnidadesModule } from './unidades/unidades.module';
import { ContratosModule } from './contratos/contratos.module';
import { TiposDocumentoModule } from './tipos-documento/tipos-documento.module';
import { DocumentosModule } from './documentos/documentos.module';
import { AlertasDocumentoModule } from './alertas-documento/alertas-documento.module';
import { AuthModule } from './auth/auth.module';
import { SupabaseGuard } from './auth/supabase.guard';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EmailModule,
    AuthModule,
    UnidadesModule,
    ContratosModule,
    TiposDocumentoModule,
    DocumentosModule,
    AlertasDocumentoModule,
    UsuariosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseGuard,
    },
  ],
})
export class AppModule {}