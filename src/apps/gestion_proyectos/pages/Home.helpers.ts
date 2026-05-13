import { Project } from "../types";
import { calculateProjectMetrics } from "../lib/calculos";

export interface TotalMetrics {
    totalMonthlySavings: number;
    totalYearlySavings: number;
}

export const getTotalMetrics = (filteredProjects: Project[]): TotalMetrics => {
    return filteredProjects.reduce<TotalMetrics>(
        (acc, project) => {
            const metrics = calculateProjectMetrics(project.processes ?? []);
            return {
                totalMonthlySavings: acc.totalMonthlySavings + metrics.total_monthly_savings,
                totalYearlySavings: acc.totalYearlySavings + metrics.total_yearly_savings,
            };
        },
        { totalMonthlySavings: 0, totalYearlySavings: 0 }
    );
};