export type DecisionLog = {
  decision: {
    _id?: string;
    sourceId: string | number;
    sourceName: string;
    publishStatus?: string;
    labelStatus?: string;
  };
  path: string;
  operations: readonly ['collect' | 'extraction' | 'normalization' | 'other', string];
  message?: string;
};

export type TechLog = {
  path: string;
  operations: readonly ['collect' | 'extraction' | 'normalization' | 'other', string];
  message?: string;
};
export type loggerType = {
  error: (a: TechLog & { stack?: string }) => void;
  warn: (a: TechLog) => void;
  info: (a: TechLog | DecisionLog) => void;
};
