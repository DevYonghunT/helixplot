import * as Comlink from 'comlink';
import { Sampler } from '../core/Sampler';
import { Evaluator } from '../core/Evaluator';
import type { DefinitionsMap, RenderConfig } from '../core/types';

const api = {
    sample(defs: DefinitionsMap, config: RenderConfig) {
        return Sampler.sample(defs, config);
    },
    evaluate(expr: string, scope: any = {}) {
        const evaluator = new Evaluator(scope);
        return evaluator.evaluate(expr);
    }
};

export type MathWorkerApi = typeof api;

Comlink.expose(api);
