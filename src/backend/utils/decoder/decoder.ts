const decoder = {
  convertLatinToUtf(buffer: Buffer) {
    return buffer.toString('latin1');
  },

  convertUtfToLatin(str: string) {
    return Buffer.from(str, 'latin1');
  },
};

export { decoder };
