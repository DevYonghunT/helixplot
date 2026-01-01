import * as Comlink from 'comlink';
import type { MathWorkerApi } from '../worker/math.worker';

let workerInstance: Worker | null = null;
let proxyInstance: Comlink.Remote<MathWorkerApi> | null = null;

const getWorker = () => {
    if (!workerInstance) {
        workerInstance = new Worker(new URL('../worker/math.worker.ts', import.meta.url), {
            type: 'module'
        });
        proxyInstance = Comlink.wrap<MathWorkerApi>(workerInstance);
    }
    return proxyInstance;
};

export function useMathWorker() {
    // Return the singleton proxy
    return getWorker();
}
