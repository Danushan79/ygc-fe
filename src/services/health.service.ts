import { APP_NAME } from "@/constants/app";

export interface HealthStatus {
  status: "ok";
  application: string;
}

export function getHealthStatus(): HealthStatus {
  return {
    status: "ok",
    application: APP_NAME,
  };
}
