export { buildDependencyManager };

type injectionValuesType<T> = {
  forProd: T;
  forTest?: T;
};

function buildDependencyManager(environmentValue: string | undefined) {
  const dependencyManager = {
    inject<T>(injectionValues: injectionValuesType<T>) {
      if (environmentValue === 'TEST') {
        return injectionValues.forTest || injectionValues.forProd;
      }
      return injectionValues.forProd;
    },
  };

  return { dependencyManager };
}
