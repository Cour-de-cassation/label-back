export { extractNumeroPourvoi };

function extractNumeroPourvoi(jurisdictionName?: string, appeal?: string) {
  const verifappeal = /^[A-Za-z]\d+$/;
  if (jurisdictionName?.includes('cassation') && appeal != undefined && verifappeal.test(appeal)) {
    appeal = appeal?.replace(/[A-Za-z]/g, '');
    const formattedappeal = appeal.substring(0, 2) + '-' + appeal.substring(2, 4) + '.' + appeal.substring(4);
    return formattedappeal;
  } else {
    return appeal;
  }
}
