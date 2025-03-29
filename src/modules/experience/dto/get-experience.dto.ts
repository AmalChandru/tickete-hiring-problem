import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetExperienceDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsString()
  @IsNotEmpty()
  date: string;
}
