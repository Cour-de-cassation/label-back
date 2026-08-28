import { documentType } from '../documentType';

export { getNextStatus };

function getNextStatus({
  status,
  route,
}: {
  status: documentType['status'];
  route: documentType['route'];
}): documentType['status'] {
  switch (status) {
    case 'loaded':
      if (route === 'automatic') {
        return 'done';
      } else if (route === 'request') {
        return 'toBeConfirmed';
      } else {
        return 'free';
      }
    case 'free':
      return 'pending';
    case 'pending':
      return 'saved';
    case 'saved':
      if (route === 'confirmation') {
        return 'toBeConfirmed';
      }
      return 'done';
    case 'locked':
      if (route === 'confirmation') {
        return 'toBeConfirmed';
      }
      return 'done';
    case 'toBeConfirmed':
      return 'done';
    default:
      return status;
  }
}
