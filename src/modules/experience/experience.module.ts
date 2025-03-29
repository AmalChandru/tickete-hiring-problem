import { Module } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { ExperienceController } from './experience.controller';
import { DatabaseService } from '../../database/database.service';

@Module({
  controllers: [ExperienceController],
  providers: [ExperienceService, DatabaseService],
})
export class ExperienceModule {}
