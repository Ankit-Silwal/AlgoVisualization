import { z } from "zod";
const complexity = z.enum(["constant", "log", "linear", "nlogn", "quadratic", "cubic", "exponential"]);
const caseModel = z.object({ best: complexity, average: complexity, worst: complexity });
const cost = z.number().min(0.0001).max(1e6);
export const algorithmSchema = z.object({ id: z.string().min(1).max(80), name: z.string().min(1).max(60), code: z.string().max(30000), language: z.string().max(30), color: z.string().regex(/^#[0-9a-fA-F]{6}$/), model: caseModel, factors: z.object({ best: cost, average: cost, worst: cost }), overhead: z.number().min(0).max(1e9), space: z.string().max(100), explanation: z.string().max(2000), conditions: z.object({ best: z.string().max(1000), average: z.string().max(1000), worst: z.string().max(1000) }), origin: z.enum(["preset", "heuristic", "manual"]) });
export const experimentSchema = z.object({ name: z.string().trim().min(1).max(100), algorithms: z.array(algorithmSchema).min(1).max(6), n: z.number().int().min(1).max(1e9), caseMode: z.enum(["best", "average", "worst", "all"]), rate: z.number().min(1).max(1e12), timeLimit: z.number().min(0.001).max(3600) });
export type Experiment = z.infer<typeof experimentSchema>;
