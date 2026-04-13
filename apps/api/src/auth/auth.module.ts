import { Module } from '@nestjs/common';
import { SupabaseGuard } from './supabase.guard';
import { PapeisGuard } from './papeis.guard';

@Module({
  providers: [SupabaseGuard, PapeisGuard],
  exports: [SupabaseGuard, PapeisGuard],
})
export class AuthModule {}