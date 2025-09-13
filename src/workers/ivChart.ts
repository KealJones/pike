import IvChartWorker from './src/ivChartWorker?worker';
let fakeId = 0;
class IvChartWorkerController {
  worker: Worker;
  actionHandlerMap: { [id: string]: (response: any) => void };
  constructor() {
    this.worker = new IvChartWorker();
    this.actionHandlerMap = {};
    this.worker.onmessage = this.onmessage.bind(this);
  }
  onmessage(e: { data: { id: any; response: any } }) {
    const { id, response } = e.data;
    if (!this.actionHandlerMap[id]) return;
    this.actionHandlerMap[id].call(this, response);
    delete this.actionHandlerMap[id];
  }
  postMessage<T>(action: Record<string, any>) {
    const id = fakeId++;
    return new Promise<T>((resolve) => {
      const message = {
        id,
        ...action,
      };
      this.worker.postMessage(message);
      this.actionHandlerMap[id] = (response: any) => {
        resolve(response);
      };
    });
  }
}
export const ivChartWorkerController = new IvChartWorkerController();
