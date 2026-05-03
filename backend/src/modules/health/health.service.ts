import { Injectable } from '@nestjs/common';

type HealthCheckResponse = {
  data: {
    service: string;
    status: 'ok';
    timestamp: string;
  };
  message: string;
};

@Injectable()
export class HealthService {
  check(): HealthCheckResponse {
    return {
      data: {
        service: 'backend',
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
      message: 'Health check completed successfully',
    };
  }
}
