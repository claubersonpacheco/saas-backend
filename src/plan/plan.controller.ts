import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './plan.entity';
import { PlanService } from './plan.service';

@Controller('plans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  @RequirePermissions('plans.read')
  findAll(@Query('projectType') projectType?: string): Promise<Plan[]> {
    return this.planService.findAll(projectType);
  }

  @Get(':id')
  @RequirePermissions('plans.read')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Plan> {
    return this.planService.findOne(id);
  }

  @Post()
  @RequirePermissions('plans.create')
  create(@Body() dto: CreatePlanDto): Promise<Plan> {
    return this.planService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('plans.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
  ): Promise<Plan> {
    return this.planService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('plans.delete')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.planService.remove(id);
  }
}
