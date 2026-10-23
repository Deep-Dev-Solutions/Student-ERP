import { Module } from "@nestjs/common";
import { PaperMakerController } from "./paper-maker.controller";
import { PaperMakerService } from "./paper-maker.service";

@Module({
  controllers: [PaperMakerController],
  providers: [PaperMakerService],
})
export class PaperMakerModule {}
