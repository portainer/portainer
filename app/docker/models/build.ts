type Data = {
  stream: string;
  errorDetail: { message: string };
};

export class ImageBuildModel {
  hasError: boolean = false;

  buildLogs: string[];

  constructor(data: Data[]) {
    const buildLogs: string[] = [];

    data.forEach((line) => {
      if (line.stream) {
        // convert unicode chars to readable chars
        const logLine = line.stream.replace(
          // eslint-disable-next-line no-control-regex
          /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
          ''
        );
        buildLogs.push(logLine);
      }

      if (line.errorDetail) {
        buildLogs.push(line.errorDetail.message);
        this.hasError = true;
      }
    });

    this.buildLogs = buildLogs;
  }
}
